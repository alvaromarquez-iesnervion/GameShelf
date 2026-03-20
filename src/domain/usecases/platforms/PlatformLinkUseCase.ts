import { IPlatformLinkUseCase } from '../../interfaces/usecases/platforms/IPlatformLinkUseCase';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { ISteamApiService } from '../../interfaces/services/ISteamApiService';
import { IEpicGamesApiService } from '../../interfaces/services/IEpicGamesApiService';
import { IGogApiService } from '../../interfaces/services/IGogApiService';
import { IPsnApiService } from '../../interfaces/services/IPsnApiService';
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
        private readonly psnService: IPsnApiService,
    ) {}

    getSteamLoginUrl(returnUrl: string): string {
        return this.steamService.getOpenIdLoginUrl(returnUrl);
    }

    getEpicLoginUrl(): string {
        return this.epicService.getLoginUrl?.() ?? this.epicService.getAuthUrl();
    }

    getEpicAuthUrl(): string {
        return this.epicService.getAuthUrl();
    }

    async linkSteam(
        userId: string,
        callbackUrl: string,
        params: Record<string, string>,
    ): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
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
        if (!userId?.trim()) throw new Error('userId requerido');
        // 1. Validar que el input sea un SteamID64 numérico o una URL de steamcommunity.com
        const trimmed = profileUrlOrId.trim();
        const isSteamId64 = /^\d{17}$/.test(trimmed);
        const isSteamUrl = /^https?:\/\/(www\.)?steamcommunity\.com\/(id|profiles)\//.test(trimmed);
        if (!isSteamId64 && !isSteamUrl) {
            throw new Error('Introduce un SteamID (17 dígitos) o una URL de perfil de Steam válida.');
        }

        // 2. Resolver el SteamID desde la URL/nombre de perfil
        const steamId = await this.steamService.resolveSteamId(trimmed);

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
        if (!userId?.trim()) throw new Error('userId requerido');
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

        // 4. Marcar Epic como vinculado y guardar tokens en SecureStore
        const linked = await this.platformRepository.linkEpicPlatform(userId, token.accountId, token);

        // 5. Sincronizar la biblioteca Epic (no bloqueante)
        this.gameRepository.syncLibrary(userId, Platform.EPIC_GAMES).catch(() => {
            // La sync puede fallar sin romper la vinculación ya completada
        });

        return linked;
    }

    async linkEpic(userId: string, fileContent: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
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
        if (!userId?.trim()) throw new Error('userId requerido');
        // 1. Intercambiar el authorization code por tokens OAuth2
        const token = await this.gogService.exchangeAuthCode(code);

        // 2. Almacenar la vinculación y los tokens en Firestore
        const linked = await this.platformRepository.linkGogPlatform(userId, token.userId, token);

        // 3. Sincronizar biblioteca GOG (no bloqueante)
        this.gameRepository.syncLibrary(userId, Platform.GOG).catch(() => {});

        return linked;
    }

    getPsnLoginUrl(): string {
        return this.psnService.getPsnLoginUrl();
    }

    /**
     * Abre el navegador del sistema para login en PSN y devuelve el access code.
     */
    async authenticatePsn(): Promise<string> {
        return this.psnService.authenticateWithBrowser();
    }

    async linkPsn(userId: string, accessCode: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
        if (!accessCode?.trim()) throw new Error('Access code requerido');

        // 1. Intercambiar el access code por tokens de acceso
        const token = await this.psnService.exchangeNpssoForTokens(accessCode.trim());

        // 2. Obtener juegos jugados (valida que el token funciona)
        const psnGames = await this.psnService.fetchPlayedGames(token.accessToken);

        // 3. Guardar juegos en Firestore
        await this.gameRepository.storePsnGames(userId, psnGames);

        // 4. Almacenar tokens en SecureStore y vinculación en Firestore
        const linked = await this.platformRepository.linkPsnPlatform(userId, token.accountId, token);

        // 5. Sincronizar biblioteca PSN (no bloqueante)
        this.gameRepository.syncLibrary(userId, Platform.PSN).catch(() => {});

        return linked;
    }

    async unlinkPlatform(userId: string, platform: Platform): Promise<void> {
        if (!userId?.trim()) throw new Error('userId requerido');
        return this.platformRepository.unlinkPlatform(userId, platform);
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        if (!userId?.trim()) throw new Error('userId requerido');
        return this.platformRepository.getLinkedPlatforms(userId);
    }
}
