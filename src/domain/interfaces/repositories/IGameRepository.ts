import { Game } from '../../entities/Game';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';

export interface IGameRepository {
    /** Lee la biblioteca desde caché Firestore. Rápido. */
    getLibraryGames(userId: string): Promise<Game[]>;
    /** Obtiene un juego concreto de Firestore para GameDetailUseCase. */
    getGameById(gameId: string): Promise<Game>;
    /** Llama a la API de la plataforma indicada y sincroniza Firestore. Lento. */
    syncLibrary(userId: string, platform: Platform): Promise<Game[]>;
    /** Búsqueda general vía ITAD /games/search/v1 (catálogo más amplio). */
    searchGames(query: string): Promise<SearchResult[]>;
}
