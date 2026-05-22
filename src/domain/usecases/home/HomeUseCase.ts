import { IHomeUseCase } from '../../interfaces/usecases/home/IHomeUseCase';
import { IGameShelfApiClient } from '../../interfaces/services/IGameShelfApiClient';
import { Game } from '../../entities/Game';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';

/**
 * Provides data for the home screen via the GameShelfApi backend.
 *
 * All methods that hit the network are wrapped in try/catch and return empty arrays
 * on failure so the home screen always renders, even with no connectivity or
 * unlinked accounts. isSteamLinked falls back to false on any API error.
 */
export class HomeUseCase implements IHomeUseCase {

    constructor(
        private readonly api: IGameShelfApiClient,
    ) {}

    async getPopularGames(_limit: number = 10): Promise<Game[]> {
        try {
            return await this.api.getPopularGames();
        } catch (err) {
            console.warn('[HomeUseCase] getPopularGames failed:', err);
            return [];
        }
    }

    async getRecentlyPlayed(_userId: string): Promise<Game[]> {
        try {
            return await this.api.getRecentlyPlayed();
        } catch (err) {
            console.warn('[HomeUseCase] getRecentlyPlayed failed:', err);
            return [];
        }
    }

    async getMostPlayed(_userId: string, _limit: number = 5): Promise<Game[]> {
        try {
            return await this.api.getMostPlayed();
        } catch (err) {
            console.warn('[HomeUseCase] getMostPlayed failed:', err);
            return [];
        }
    }

    async isSteamLinked(_userId: string): Promise<boolean> {
        try {
            const platforms = await this.api.getLinkedPlatforms();
            return platforms.some(p => p.getPlatform() === Platform.STEAM);
        } catch {
            return false;
        }
    }

    async searchGames(query: string, _userId: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];
        return this.api.searchGames(query);
    }
}
