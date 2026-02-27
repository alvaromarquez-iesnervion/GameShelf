import { Game } from '../../entities/Game';
import { SteamGameMetadata } from '../../dtos/SteamGameMetadata';

/**
 * Steam usa OpenID 2.0 (NO OAuth2). No hay token que almacenar.
 * Solo se guarda el SteamID del usuario. La API Key es del desarrollador.
 *
 * NOTA: Steam rechaza custom URL schemes (gameshelf://, exp://) como return_to.
 * Solo acepta HTTP/HTTPS. Por eso el flujo principal de vinculación usa
 * resolveSteamId() en lugar de OpenID WebBrowser.
 *
 * LIMITACIÓN: el perfil del usuario DEBE ser público (Game details = Public).
 * Si es privado, GetOwnedGames devuelve vacío → avisar al usuario.
 */
export interface ISteamApiService {
    /** Construye la URL completa de login OpenID 2.0 para abrir en WebView. */
    getOpenIdLoginUrl(returnUrl: string): string;
    /** Extrae el SteamID 64-bit de la URL de callback de OpenID. */
    extractSteamIdFromCallback(callbackUrl: string): string;
    /** POST check_authentication a Steam para verificar la respuesta OpenID. */
    verifyOpenIdResponse(params: Record<string, string>): Promise<boolean>;
    /** GET IPlayerService/GetOwnedGames/v1 → biblioteca del usuario con playtime. */
    getUserGames(steamId: string): Promise<Game[]>;
    /** GET IPlayerService/GetRecentlyPlayedGames/v1 → juegos jugados en las últimas 2 semanas. */
    getRecentlyPlayedGames(steamId: string): Promise<Game[]>;
    /** GET ISteamChartsService/GetMostPlayedGames/v1 → juegos más jugados globalmente (no requiere usuario). */
    getMostPlayedGames(limit?: number): Promise<Game[]>;
    /** GET ISteamUser/GetPlayerSummaries/v2 → comprueba communityvisibilitystate === 3. */
    checkProfileVisibility(steamId: string): Promise<boolean>;
    /**
     * Resuelve cualquier forma de identificador de Steam a un SteamID 64-bit.
     * Acepta:
     *   - SteamID de 17 dígitos:           "76561197960287930"
     *   - URL de perfil numérica:           "https://steamcommunity.com/profiles/76561197960287930"
     *   - URL de perfil con vanity name:    "https://steamcommunity.com/id/gaben"
     *   - Vanity name solo:                 "gaben"
     * Lanza un error si el identificador no es válido.
     */
    resolveSteamId(profileUrlOrId: string): Promise<string>;
    /**
     * GET store.steampowered.com/api/appdetails?appids={appId}
     * Returns enriched game metadata (genres, developers, publishers, release date,
     * Metacritic score, screenshots, recommendation count).
     * Returns null if the request fails or the game is not found in the Steam store.
     */
    getSteamAppDetails(appId: number): Promise<SteamGameMetadata | null>;
    /**
     * GET store.steampowered.com/api/storesearch/?term={title}
     * Searches the Steam Store for a game by title and returns the best-matching
     * Steam App ID, or null if no confident match is found.
     * Used to enrich Epic Games library entries with Steam metadata.
     */
    searchSteamAppId(title: string): Promise<number | null>;
}
