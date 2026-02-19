import { LinkedPlatform } from '../../../entities/LinkedPlatform';
import { Platform } from '../../../enums/Platform';

export interface IPlatformLinkUseCase {
    /** Construye la URL OpenID 2.0 de Steam para abrir en WebView. */
    getSteamLoginUrl(returnUrl: string): string;
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
     * Completa el flujo de importación de Epic:
     *  1. parseExportedLibrary (JSON GDPR)
     *  2. linkEpicPlatform
     *  3. Guarda los juegos parseados
     */
    linkEpic(userId: string, fileContent: string): Promise<LinkedPlatform>;
    /** Elimina la vinculación y los juegos de esa plataforma. */
    unlinkPlatform(userId: string, platform: Platform): Promise<void>;
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
}
