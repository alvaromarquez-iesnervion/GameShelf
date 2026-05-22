import { ISearchUseCase } from '../../interfaces/usecases/games/ISearchUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { SearchResult } from '../../entities/SearchResult';
import { Game } from '../../entities/Game';
import { Platform } from '../../enums/Platform';

/**
 * Searches the global ITAD catalogue.
 *
 * Cross-references results with:
 *   - IWishlistRepository to mark isInWishlist.
 *   - IGameRepository.getLibraryGames to mark isOwned + ownedPlatforms.
 *
 * The library is cached in memory with a TTL to avoid a full Firestore
 * read on every debounced search (P-02).
 *
 * Library and wishlist are fetched in parallel with the search to
 * minimise total latency.
 */
export class SearchUseCase implements ISearchUseCase {

    private static readonly LIBRARY_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

    private _libraryCache: Game[] | null = null;
    private _libraryCacheUserId: string | null = null;
    private _libraryCacheExpiry: number = 0;

    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly wishlistRepository: IWishlistRepository,
    ) {}

    private async getCachedLibrary(userId: string): Promise<Game[]> {
        const now = Date.now();
        if (
            this._libraryCache !== null &&
            this._libraryCacheUserId === userId &&
            now < this._libraryCacheExpiry
        ) {
            return this._libraryCache;
        }
        const games = await this.gameRepository.getLibraryGames(userId).catch(() => []);
        this._libraryCache = games;
        this._libraryCacheUserId = userId;
        this._libraryCacheExpiry = now + SearchUseCase.LIBRARY_CACHE_TTL_MS;
        return games;
    }

    /** Invalidates the library cache. Call after sync or library changes. */
    invalidateLibraryCache(): void {
        this._libraryCache = null;
        this._libraryCacheExpiry = 0;
    }

    async searchGames(query: string, userId: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];

        const [results, libraryGames, wishlistGameIds] = await Promise.all([
            this.gameRepository.searchGames(query),
            this.getCachedLibrary(userId),
            this.wishlistRepository.getWishlistGameIds(userId).catch(() => new Set<string>()),
        ]);

        if (results.length === 0) return results;

        // Library indices for cross-referencing by steamAppId and normalised title
        const steamAppIdToPlatforms = new Map<number, Platform[]>();
        const titleToPlatforms = new Map<string, Platform[]>();
        for (const game of libraryGames) {
            const appId = game.getSteamAppId();
            if (appId !== null) {
                const existing = steamAppIdToPlatforms.get(appId) ?? [];
                existing.push(game.getPlatform());
                steamAppIdToPlatforms.set(appId, existing);
            }
            const normTitle = game.getTitle().toLowerCase().trim();
            if (normTitle) {
                const existing = titleToPlatforms.get(normTitle) ?? [];
                existing.push(game.getPlatform());
                titleToPlatforms.set(normTitle, existing);
            }
        }

        const enriched = results.map(result => {
            let r = result;

            if (wishlistGameIds.has(r.getId())) {
                r = r.withIsInWishlist(true);
            }

            // Merge platforms found by steamAppId and by title
            const platformsSet = new Set<Platform>();
            const appId = r.getSteamAppId();
            if (appId !== null) {
                for (const p of steamAppIdToPlatforms.get(appId) ?? []) platformsSet.add(p);
            }
            const normTitle = r.getTitle().toLowerCase().trim();
            for (const p of titleToPlatforms.get(normTitle) ?? []) platformsSet.add(p);

            if (platformsSet.size > 0) {
                r = r.withIsOwned(true).withOwnedPlatforms([...platformsSet]);
            }

            return r;
        });

        return enriched;
    }
}
