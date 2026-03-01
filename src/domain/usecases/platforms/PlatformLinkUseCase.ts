import { IPlatformLinkUseCase } from '../../interfaces/usecases/platforms/IPlatformLinkUseCase';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { ISteamApiService } from '../../interfaces/services/ISteamApiService';
import { IEpicGamesApiService } from '../../interfaces/services/IEpicGamesApiService';
import { IGogApiService } from '../../interfaces/services/IGogApiService';
import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { Platform } from '../../enums/Platform';

/**
 * Orquesta la vinculación y desvinculación de plataformas externas.
 *
 * Flujo Steam (OpenID 2.0):
 *   1. getSteamLoginUrl → construye URL para WebView
 *   2. linkSteam → verifica respuesta OpenID, extrae SteamID, comprueba visibilidad,
 *      almacena en Firestore y sincroniza la biblioteca.
 *
 * Flujo Epic (importación manual):
 *   1. linkEpic → parsea el JSON del export GDPR, almacena plataforma en Firestore.
 *      Los juegos parseados se guardan vía syncLibrary.
 */
export class PlatformLinkUseCase implements IPlatformLinkUseCase {

    constructor(
        private readonly platformRepository: IPlatformRepository,
        private readonly gameRepository: IGameRepository,
        private readonly steamService: ISteamApiService,
        private readonly epicService: IEpicGamesApiService,
        private readonly gogService: IGogApiService,
    ) {}

    getSteamLoginUrl(returnUrl: string): string {
        return this.steamService.getOpenIdLoginUrl(returnUrl);
    }

    getEpicAuthUrl(): string {
        return this.epicService.getAuthUrl();
    }

    async linkSteam(
        userId: string,
        callbackUrl: string,
        params: Record<string, string>,
    ): Promise<LinkedPlatform> {
        // 1. Verificar respuesta OpenID con Steam
        const isValid = await this.steamService.verifyOpenIdResponse(params);
        if (!isValid) {
            throw new Error('La verificación OpenID de Steam ha fallado. Inténtalo de nuevo.');
        }

        // 2. Extraer SteamID del callback
        const steamId = this.steamService.extractSteamIdFromCallback(callbackUrl);

        // 3. Comprobar visibilidad del perfil (debe ser público)
        const isPublic = await this.steamService.checkProfileVisibility(steamId);
        if (!isPublic) {
            throw new Error(
                'Tu perfil de Steam es privado. Ve a Ajustes → Privacidad → Estado del juego → Público y vuelve a intentarlo.',
            );
        }

        // 4. Almacenar la vinculación en Firestore
        const linked = await this.platformRepository.linkSteamPlatform(userId, steamId);

        // 5. Sincronizar biblioteca (no bloqueante para el flujo de vinculación)
        this.gameRepository.syncLibrary(userId, Platform.STEAM).catch(() => {
            // La sync puede fallar sin romper la vinculación ya completada
        });

        return linked;
    }

    async linkSteamById(userId: string, profileUrlOrId: string): Promise<LinkedPlatform> {
        // 1. Resolver el SteamID desde la URL/nombre de perfil
        const steamId = await this.steamService.resolveSteamId(profileUrlOrId);

        // 2. Comprobar visibilidad del perfil (debe ser público)
        const isPublic = await this.steamService.checkProfileVisibility(steamId);
        if (!isPublic) {
            throw new Error(
                'Tu perfil de Steam es privado. Ve a Ajustes de Steam → ' +
                'Privacidad → Estado del juego → Público y vuelve a intentarlo.',
            );
        }

        // 3. Almacenar la vinculación
        const linked = await this.platformRepository.linkSteamPlatform(userId, steamId);

        // 4. Sincronizar biblioteca (no bloqueante)
        this.gameRepository.syncLibrary(userId, Platform.STEAM).catch(() => {});

        return linked;
    }

    async linkEpicByAuthCode(userId: string, authCode: string): Promise<LinkedPlatform> {
        // 1. Intercambiar el authorization code por un access token
        const token = await this.epicService.exchangeAuthCode(authCode);

        // 2. Obtener la biblioteca de entitlements con el token
        const epicGames = await this.epicService.fetchLibrary(token.accessToken, token.accountId);

        if (epicGames.length === 0) {
            throw new Error(
                'No se encontraron juegos en tu biblioteca de Epic Games.',
            );
        }

        // 3. Almacenar juegos en el repositorio (en memoria, para sincronización posterior)
        await this.gameRepository.storeEpicGames(userId, epicGames);

        // 4. Marcar Epic como vinculado (guardamos el accountId real, no "imported")
        const linked = await this.platformRepository.linkEpicPlatform(userId, token.accountId);

        // 5. Sincronizar la biblioteca Epic (no bloqueante)
        this.gameRepository.syncLibrary(userId, Platform.EPIC_GAMES).catch(() => {
            // La sync puede fallar sin romper la vinculación ya completada
        });

        return linked;
    }

    async linkEpic(userId: string, fileContent: string): Promise<LinkedPlatform> {
        // 1. Parsear el JSON del export GDPR de Epic
        // Devuelve array de Game con itadGameId enriquecido
        const epicGames = await this.epicService.parseExportedLibrary(fileContent);

        if (epicGames.length === 0) {
            throw new Error(
                'No se encontraron juegos en el archivo. ' +
                'Asegúrate de que es el JSON correcto del export GDPR de Epic Games.',
            );
        }

        // 2. Almacenar juegos parseados en el repositorio (en memoria, para sincronización posterior)
        await this.gameRepository.storeEpicGames(userId, epicGames);

        // 3. Marcar Epic como vinculado en Firestore
        const linked = await this.platformRepository.linkEpicPlatform(userId);

        // 4. Sincronizar la biblioteca Epic (no bloqueante)
        this.gameRepository.syncLibrary(userId, Platform.EPIC_GAMES).catch(() => {
            // La sync puede fallar sin romper la vinculación ya completada
        });

        return linked;
    }

    getGogAuthUrl(): string {
        return this.gogService.getAuthUrl();
    }

    async linkGogByCode(userId: string, code: string): Promise<LinkedPlatform> {
        // 1. Intercambiar el authorization code por tokens OAuth2
        const token = await this.gogService.exchangeAuthCode(code);

        // 2. Almacenar la vinculación y los tokens en Firestore
        const linked = await this.platformRepository.linkGogPlatform(userId, token.userId, token);

        // 3. Sincronizar biblioteca GOG (no bloqueante)
        this.gameRepository.syncLibrary(userId, Platform.GOG).catch(() => {});

        return linked;
    }

    async unlinkPlatform(userId: string, platform: Platform): Promise<void> {
        return this.platformRepository.unlinkPlatform(userId, platform);
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        return this.platformRepository.getLinkedPlatforms(userId);
    }
}
