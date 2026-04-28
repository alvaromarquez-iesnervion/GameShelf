import { Game } from '../../entities/Game';
import { GameDetail } from '../../entities/GameDetail';
import { LibraryStats } from '../../entities/LibraryStats';
import { WishlistItem } from '../../entities/WishlistItem';
import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';
import { LibraryPage } from '../repositories/IGameRepository';

export interface IGameShelfApiClient {
    // ── Auth ──────────────────────────────────────────────────────────────
    /** Registra / actualiza el perfil del usuario en el backend tras login. */
    syncUser(): Promise<void>;

    // ── Library ───────────────────────────────────────────────────────────
    /** Devuelve todos los juegos de la biblioteca del usuario autenticado. */
    getLibraryGames(): Promise<Game[]>;
    /** Devuelve estadísticas agregadas de la biblioteca (únicos por plataforma, playtime). */
    getLibraryStats(): Promise<LibraryStats>;
    /**
     * Devuelve una página de la biblioteca.
     * El cursor es el ID del último juego de la página anterior (undefined = primera).
     */
    getLibraryGamesPage(pageSize: number, cursor?: string): Promise<LibraryPage>;
    /** Sincroniza la biblioteca de la plataforma indicada y devuelve los juegos actualizados. */
    syncLibrary(platform: Platform): Promise<Game[]>;

    // ── Settings / Preferences ────────────────────────────────────────────
    /** Obtiene el código de país guardado en el backend, o null si no hay preferencia. */
    getSavedCountry(): Promise<string | null>;
    /** Guarda la preferencia de país del usuario (ej: "ES", "MX"). */
    setSavedCountry(country: string): Promise<void>;

    // ── Games ─────────────────────────────────────────────────────────────
    /** Detalle enriquecido: ProtonDB + HLTB + ITAD + metadata Steam. */
    getGameDetail(gameId: string, steamAppId?: number | null, platform?: Platform | null, country?: string): Promise<GameDetail>;
    /**
     * Busca el juego en la biblioteca del usuario.
     * Si no existe, lo resuelve desde el catálogo (ITAD/Steam).
     */
    getOrCreateGame(gameId: string, steamAppId?: number | null): Promise<Game>;
    /** DLCs del usuario para el juego base indicado. */
    getOwnedDlcs(parentGameId: string): Promise<Game[]>;

    // ── Search ────────────────────────────────────────────────────────────
    /** Búsqueda full-text en el catálogo con estado de propiedad y wishlist. */
    searchGames(query: string): Promise<SearchResult[]>;

    // ── Wishlist ──────────────────────────────────────────────────────────
    /** Obtiene la wishlist del usuario, opcionalmente con precios en una moneda específica. */
    getWishlist(country?: string): Promise<WishlistItem[]>;
    addToWishlist(gameId: string, title: string, coverUrl: string, platform?: Platform | null): Promise<WishlistItem>;
    removeFromWishlist(itemId: string): Promise<void>;
    isInWishlist(gameId: string): Promise<boolean>;

    // ── Platforms ─────────────────────────────────────────────────────────
    getLinkedPlatforms(): Promise<LinkedPlatform[]>;
    /** URL OAuth que el cliente debe abrir en un WebView. */
    getPlatformAuthUrl(platform: Platform): Promise<string>;
    /** Vincula Steam via OpenID: envía la URL completa del callback (incluyendo params de OpenID). */
    linkSteamOpenId(callbackUrl: string): Promise<LinkedPlatform>;
    /** Vincula Steam manualmente via SteamID o URL de perfil. */
    linkSteamManual(profileUrlOrId: string): Promise<LinkedPlatform>;
    /** Vincula Epic (auth code) o GOG (authorization code) con el backend. */
    linkWithCode(platform: Platform, code: string): Promise<LinkedPlatform>;
    /** Vincula PSN usando el token NPSSO provisto por el usuario. */
    linkWithNpsso(npsso: string): Promise<LinkedPlatform>;
    /** Vincula Epic usando la exportación GDPR (array de juegos parseados). */
    linkWithGdpr(games: object[]): Promise<LinkedPlatform>;
    unlinkPlatform(platform: Platform): Promise<void>;

    // ── Home ──────────────────────────────────────────────────────────────
    getPopularGames(): Promise<Game[]>;
    getRecentlyPlayed(): Promise<Game[]>;
    getMostPlayed(): Promise<Game[]>;
}
