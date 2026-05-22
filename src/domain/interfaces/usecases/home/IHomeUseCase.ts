import { Game } from '../../../entities/Game';
import { SearchResult } from '../../../entities/SearchResult';

export interface IHomeUseCase {
    /** Globally popular games (does not require a linked account). */
    getPopularGames(limit?: number): Promise<Game[]>;
    /** Games played by the user in the last 2 weeks (requires Steam linked). */
    getRecentlyPlayed(userId: string): Promise<Game[]>;
    /** Most-played games by the user (requires Steam linked). */
    getMostPlayed(userId: string, limit?: number): Promise<Game[]>;
    /** Returns whether the user has Steam linked. */
    isSteamLinked(userId: string): Promise<boolean>;
    /** Search across the ITAD catalogue. */
    searchGames(query: string, userId: string): Promise<SearchResult[]>;
}
