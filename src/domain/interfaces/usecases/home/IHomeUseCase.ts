import { Game } from '../../../entities/Game';
import { SearchResult } from '../../../entities/SearchResult';

export interface IHomeUseCase {
    /** Juegos más populares globalmente (no requiere usuario vinculado). */
    getPopularGames(limit?: number): Promise<Game[]>;
    /** Juegos jugados por el usuario en las últimas 2 semanas (requiere Steam vinculado). */
    getRecentlyPlayed(userId: string): Promise<Game[]>;
    /** Juegos más jugados por el usuario (requiere Steam vinculado). */
    getMostPlayed(userId: string, limit?: number): Promise<Game[]>;
    /** Búsqueda en catálogo ITAD. */
    searchGames(query: string, userId: string): Promise<SearchResult[]>;
}
