import { LinkedPlatform } from '../../../entities/LinkedPlatform';
import { Platform } from '../../../enums/Platform';

export interface IPlatformLinkUseCase {
    /** Construye la URL OpenID 2.0 de Steam para abrir en WebView. */
    getSteamLoginUrl(returnUrl: string): string;
    /**
     * Devuelve la URL que el usuario debe abrir en el navegador para iniciar sesión
     * en Epic Games y obtener el authorization code.
     */
    getEpicAuthUrl(): string;
    /**
     * Completa el flujo OpenID 2.0 de Steam:
     *  1. verifyOpenIdResponse
     *  2. extractSteamIdFromCallback
     *  3. checkProfileVisibility
     *  4. linkSteamPlatform
     *  5. syncLibrary de Steam
     */
    linkSteam(userId: string, callbackUrl: string, params: Record<string, string>): Promise<LinkedPlatform>;
    /**
     * Vinculación directa con SteamID o URL de perfil.
     * Alternativa a linkSteam que no requiere el flujo OpenID WebBrowser
     * (Steam rechaza custom URL schemes como return_to).
     *  1. resolveSteamId → SteamID 64-bit
     *  2. checkProfileVisibility → debe ser público
     *  3. linkSteamPlatform
     *  4. syncLibrary de Steam
     */
    linkSteamById(userId: string, profileUrlOrId: string): Promise<LinkedPlatform>;
    /**
     * Vinculación automática de Epic Games via authorization code (API interna no oficial).
     * Flujo preferido — el usuario solo copia un código corto del navegador:
     *  1. exchangeAuthCode → EpicAuthToken
     *  2. fetchLibrary → Game[]
     *  3. storeEpicGames
     *  4. linkEpicPlatform (con accountId real)
     *  5. syncLibrary de Epic (no bloqueante)
     *
     * AVISO: usa API interna de Epic. Puede dejar de funcionar sin previo aviso.
     */
    linkEpicByAuthCode(userId: string, authCode: string): Promise<LinkedPlatform>;
    /**
     * Vinculación manual de Epic via export GDPR (método de reserva).
     * Requiere que el usuario solicite y descargue sus datos en epicgames.com/account/privacy.
     *  1. parseExportedLibrary (JSON GDPR)
     *  2. storeEpicGames
     *  3. linkEpicPlatform
     *  4. syncLibrary de Epic (no bloqueante)
     */
    linkEpic(userId: string, fileContent: string): Promise<LinkedPlatform>;
    /** Elimina la vinculación y los juegos de esa plataforma. */
    unlinkPlatform(userId: string, platform: Platform): Promise<void>;
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
}
