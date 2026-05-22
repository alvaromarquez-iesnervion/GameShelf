import { Game } from '../../entities/Game';
import { LibraryStats } from '../../entities/LibraryStats';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';
import { LibraryTab } from '../../enums/LibraryTab';
import { SortCriteria } from '../../enums/SortCriteria';

/** Library game with platforms merged from the backend. */
export interface MergedLibraryGame {
    game: Game;
    platforms: Platform[];
}

/** Paginated library result with server-side filter support. */
export interface LibraryPage {
    games: MergedLibraryGame[];
    total: number;
    hasMore: boolean;
    currentPage: number;
}

export interface IGameRepository {
    /** Reads the library from Firestore cache. Fast, no extra network call. */
    getLibraryGames(userId: string): Promise<Game[]>;
    /**
     * Reads the library in pages with server-side filters applied.
     * @param userId       User ID.
     * @param pageSize     Maximum number of games per page.
     * @param page         Page number (1-indexed).
     * @param tab          Filter by PC/Console tab.
     * @param sortCriteria Sort criterion.
     * @param searchQuery  Search term.
     * @param platforms    List of platforms to filter by.
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
    /** Fetches a specific game from the user's Firestore library. */
    getGameById(userId: string, gameId: string): Promise<Game>;
    /**
     * Looks up the game in the user's library first.
     * If not found, resolves it from ITAD using the gameId (numeric steamAppId
     * or ITAD UUID) as the identifier.
     */
    getOrCreateGameById(userId: string, gameId: string, steamAppId?: number | null): Promise<Game>;
    /** Calls the given platform's API and syncs Firestore. Slow. */
    syncLibrary(userId: string, platform: Platform): Promise<Game[]>;
    /** General search via ITAD /games/search/v1 (wider catalogue). */
    searchGames(query: string): Promise<SearchResult[]>;
    /** Stores parsed Epic games in Firestore (internal use case storage). */
    storeEpicGames(userId: string, games: Game[]): Promise<void>;
    /** Stores games fetched from PSN in Firestore (internal use case storage). */
    storePsnGames(userId: string, games: Game[]): Promise<void>;
    /**
     * Persists a resolved Steam App ID for an Epic Games library entry.
     * The platform field remains EPIC_GAMES; steamAppId is an auxiliary field
     * used exclusively to enrich the game detail with Steam metadata (ProtonDB,
     * screenshots, Metacritic, etc.).
     */
    updateSteamAppId(userId: string, gameId: string, steamAppId: number): Promise<void>;
    /** Returns owned DLCs whose parentGameId matches the given game. */
    getOwnedDlcsForGame(userId: string, parentGameId: string): Promise<Game[]>;
    /** Returns aggregated library stats (unique games per platform, playtime). */
    getLibraryStats(userId: string): Promise<LibraryStats>;
}
