import { Game } from '../../entities/Game';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';

export interface IGameRepository {
    /** Lee la biblioteca desde caché Firestore. Rápido. */
    getLibraryGames(userId: string): Promise<Game[]>;
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
}
