import { Game } from '../../entities/Game';
import { LibraryStats } from '../../entities/LibraryStats';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';
import { LibraryTab } from '../../enums/LibraryTab';
import { SortCriteria } from '../../enums/SortCriteria';

/** Juego de biblioteca con plataformas merged del backend. */
export interface MergedLibraryGame {
    game: Game;
    platforms: Platform[];
}

/** Resultado paginado de la biblioteca con soporte para filtros server-side. */
export interface LibraryPage {
    games: MergedLibraryGame[];
    total: number;
    hasMore: boolean;
    currentPage: number;
}

export interface IGameRepository {
    /** Lee la biblioteca desde caché Firestore. Rápido. */
    getLibraryGames(userId: string): Promise<Game[]>;
    /**
     * Lee la biblioteca en páginas con filtros server-side.
     * @param userId       ID del usuario.
     * @param pageSize     Número máximo de juegos por página.
     * @param page         Número de página (1-indexed).
     * @param tab          Filtro por pestaña PC/Consola.
     * @param sortCriteria Criterio de ordenación.
     * @param searchQuery  Término de búsqueda.
     * @param platforms    Lista de plataformas a filtrar.
     */
    getLibraryGamesPage(
        userId: string,
        pageSize: number,
        page?: number,
        tab?: LibraryTab,
        sortCriteria?: SortCriteria,
        searchQuery?: string,
        platforms?: Platform[],
    ): Promise<LibraryPage>;
    /** Obtiene un juego concreto de la biblioteca del usuario en Firestore. */
    getGameById(userId: string, gameId: string): Promise<Game>;
    /**
     * Busca el juego en la biblioteca del usuario primero.
     * Si no existe, lo resuelve desde ITAD usando el gameId (steamAppId numérico
     * o ITAD UUID) como identificador.
     */
    getOrCreateGameById(userId: string, gameId: string, steamAppId?: number | null): Promise<Game>;
    /** Llama a la API de la plataforma indicada y sincroniza Firestore. Lento. */
    syncLibrary(userId: string, platform: Platform): Promise<Game[]>;
    /** Búsqueda general vía ITAD /games/search/v1 (catálogo más amplio). */
    searchGames(query: string): Promise<SearchResult[]>;
    /** Almacena juegos parseados de Epic en memoria (uso interno del use case). */
    storeEpicGames(userId: string, games: Game[]): Promise<void>;
    /** Almacena juegos obtenidos de PSN en Firestore (uso interno del use case). */
    storePsnGames(userId: string, games: Game[]): Promise<void>;
    /**
     * Persists a resolved Steam App ID for an Epic Games library entry.
     * The platform field remains EPIC_GAMES; steamAppId is an auxiliary field
     * used exclusively to enrich the game detail with Steam metadata (ProtonDB,
     * screenshots, Metacritic, etc.).
     */
    updateSteamAppId(userId: string, gameId: string, steamAppId: number): Promise<void>;
    /** Devuelve los DLCs poseídos cuyo parentGameId coincida con el juego indicado. */
    getOwnedDlcsForGame(userId: string, parentGameId: string): Promise<Game[]>;
    /** Devuelve estadísticas agregadas de la biblioteca (únicos por plataforma, playtime). */
    getLibraryStats(userId: string): Promise<LibraryStats>;
}
