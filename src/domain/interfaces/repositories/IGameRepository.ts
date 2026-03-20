import { Game } from '../../entities/Game';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';

/** Resultado de una página de biblioteca. nextCursor es null en la última página. */
export interface LibraryPage {
    games: Game[];
    nextCursor: string | null;
}

export interface IGameRepository {
    /** Lee la biblioteca desde caché Firestore. Rápido. */
    getLibraryGames(userId: string): Promise<Game[]>;
    /**
     * Lee la biblioteca en páginas ordenadas por ID de documento.
     * @param pageSize Número máximo de juegos por página (recomendado: 200).
     * @param cursor   ID del último documento de la página anterior (undefined = primera página).
     */
    getLibraryGamesPage(userId: string, pageSize: number, cursor?: string): Promise<LibraryPage>;
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
}
