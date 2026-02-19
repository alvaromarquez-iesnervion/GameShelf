import { Game } from '../../../entities/Game';
import { SearchResult } from '../../../entities/SearchResult';

export interface IHomeUseCase {
    getRecentlyPlayed(userId: string): Promise<Game[]>;
    getMostPlayed(userId: string, limit?: number): Promise<Game[]>;
    searchGames(query: string, userId: string): Promise<SearchResult[]>;
}
