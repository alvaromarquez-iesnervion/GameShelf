import { ILibraryUseCase } from '../../interfaces/usecases/library/ILibraryUseCase';
import { IGameRepository, LibraryPage } from '../../interfaces/repositories/IGameRepository';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { Game } from '../../entities/Game';
import { LibraryStats } from '../../entities/LibraryStats';
import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { Platform } from '../../enums/Platform';
import { LibraryTab } from '../../enums/LibraryTab';
import { SortCriteria } from '../../enums/SortCriteria';

/**
 * Orchestrates access to the user's game library.
 *
 * - getLibrary: reads from Firestore cache (fast, no extra network call).
 * - syncLibrary: calls the platform API and updates Firestore (slow).
 * - getLinkedPlatforms: returns the user's linked platforms.
 *
 * Note: filtering/searching by title, tab, and platforms is done server-side
 * to avoid unnecessary data transfer and leverage backend pagination.
 */
export class LibraryUseCase implements ILibraryUseCase {

    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly platformRepository: IPlatformRepository,
    ) {}

    async getLibrary(userId: string): Promise<Game[]> {
        return this.gameRepository.getLibraryGames(userId);
    }

    async getLibraryPage(
        userId: string,
        pageSize: number,
        page?: number,
        tab?: LibraryTab,
        sortCriteria?: SortCriteria,
        searchQuery?: string,
        platforms?: Platform[],
    ): Promise<LibraryPage> {
        return this.gameRepository.getLibraryGamesPage(
            userId, pageSize, page, tab, sortCriteria, searchQuery, platforms,
        );
    }

    async syncLibrary(userId: string, platform: Platform): Promise<Game[]> {
        return this.gameRepository.syncLibrary(userId, platform);
    }

    async autoSyncLibrary(userId: string): Promise<Game[]> {
        // 1. Fetch linked platforms
        const platforms = await this.platformRepository.getLinkedPlatforms(userId);
        
        if (platforms.length === 0) {
            return this.gameRepository.getLibraryGames(userId);
        }

        // 2. Sync all platforms in parallel using Promise.allSettled
        const results = await Promise.allSettled(
            platforms.map(p => this.gameRepository.syncLibrary(userId, p.getPlatform())),
        );

        // 3. Merge games from successful platforms, deduplicating by ID
        const seen = new Map<string, Game>();
        for (const result of results) {
            if (result.status === 'fulfilled') {
                for (const game of result.value) {
                    seen.set(game.getId(), game);
                }
            }
        }

        return Array.from(seen.values());
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        return this.platformRepository.getLinkedPlatforms(userId);
    }

    async getLibraryStats(userId: string): Promise<LibraryStats> {
        return this.gameRepository.getLibraryStats(userId);
    }
}
