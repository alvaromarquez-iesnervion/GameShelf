import { Game } from '../../../entities/Game';
import { LibraryStats } from '../../../entities/LibraryStats';
import { LinkedPlatform } from '../../../entities/LinkedPlatform';
import { Platform } from '../../../enums/Platform';
import { LibraryPage } from '../../repositories/IGameRepository';
import { LibraryTab } from '../../../enums/LibraryTab';
import { SortCriteria } from '../../../enums/SortCriteria';

export interface ILibraryUseCase {
    /** Returns all library games from the Firestore cache. */
    getLibrary(userId: string): Promise<Game[]>;
    /**
     * Returns a paginated and filtered page of the library.
     * Filtering (tab, search, platforms) and sorting are applied server-side.
     */
    getLibraryPage(
        userId: string,
        pageSize: number,
        page?: number,
        tab?: LibraryTab,
        sortCriteria?: SortCriteria,
        searchQuery?: string,
        platforms?: Platform[],
    ): Promise<LibraryPage>;
    /**
     * Triggers a sync with the given platform's API and updates Firestore.
     * Iterates all linked platforms if no specific platform is provided.
     */
    syncLibrary(userId: string, platform: Platform): Promise<Game[]>;
    /**
     * Syncs all linked platforms for the user.
     * Used during autoSync at session start. Returns the unified library.
     */
    autoSyncLibrary(userId: string): Promise<Game[]>;
    /** Returns the user's linked platforms. */
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
    /** Returns aggregated library stats from the API. */
    getLibraryStats(userId: string): Promise<LibraryStats>;
}
