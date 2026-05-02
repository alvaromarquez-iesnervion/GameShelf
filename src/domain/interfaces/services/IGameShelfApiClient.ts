import { Game } from '../../entities/Game';
import { GameDetail } from '../../entities/GameDetail';
import { WishlistItem } from '../../entities/WishlistItem';
import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { LibraryStats } from '../../entities/LibraryStats';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';
import { LibraryPage } from '../repositories/IGameRepository';
import { LibraryTab } from '../../enums/LibraryTab';
import { SortCriteria } from '../../enums/SortCriteria';

export interface IGameShelfApiClient {
    // ── Auth ──────────────────────────────────────────────────────────────
    /** Registra / actualiza el perfil del usuario en el backend tras login. */
    syncUser(): Promise<void>;

    // ── Library ───────────────────────────────────────────────────────────
    /** Devuelve estadísticas agregadas de la biblioteca (únicos por plataforma, playtime). */
    getLibraryStats(): Promise<LibraryStats>;
    /**
     * Devuelve una página paginada y filtrada de la biblioteca.
     * @param pageSize     Número máximo de juegos por página.
     * @param page         Número de página (1-indexed).
     * @param tab          Filtro por pestaña PC/Consola.
     * @param sortCriteria Criterio de ordenación.
     * @param searchQuery  Término de búsqueda.
     * @param platforms    Lista de plataformas a filtrar.
     */
    getLibraryGamesPage(
        pageSize: number,
        page?: number,
        tab?: LibraryTab,
        sortCriteria?: SortCriteria,
        searchQuery?: string,
        platforms?: Platform[],
    ): Promise<LibraryPage>;
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

    // ── Cache ─────────────────────────────────────────────────────────────
    clearCache(): void;
}
