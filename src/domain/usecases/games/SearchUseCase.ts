import { ISearchUseCase } from '../../interfaces/usecases/games/ISearchUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { SearchResult } from '../../entities/SearchResult';
import { Game } from '../../entities/Game';
import { Platform } from '../../enums/Platform';

/**
 * Búsqueda en el catálogo global de ITAD.
 *
 * Cruza los resultados con:
 *   - IWishlistRepository para marcar isInWishlist.
 *   - IGameRepository.getLibraryGames para marcar isOwned + ownedPlatforms.
 *
 * La biblioteca se cachea en memoria con TTL para evitar una lectura
 * completa de Firestore en cada búsqueda debounceada (P-02).
 *
 * La biblioteca y la wishlist se cargan en paralelo con la búsqueda para
 * minimizar la latencia total.
 */
export class SearchUseCase implements ISearchUseCase {

    private static readonly LIBRARY_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutos

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

    /** Invalida el cache de biblioteca. Llamar tras sync o cambios en la biblioteca. */
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

        // Índice de biblioteca: steamAppId → plataformas que poseen ese juego
        const steamAppIdToPlatforms = new Map<number, Platform[]>();
        for (const game of libraryGames) {
            const appId = game.getSteamAppId();
            if (appId !== null) {
                const existing = steamAppIdToPlatforms.get(appId) ?? [];
                existing.push(game.getPlatform());
                steamAppIdToPlatforms.set(appId, existing);
            }
        }

        const enriched = results.map(result => {
            let r = result;

            if (wishlistGameIds.has(r.getId())) {
                r = r.withIsInWishlist(true);
            }

            const appId = r.getSteamAppId();
            if (appId !== null) {
                const platforms = steamAppIdToPlatforms.get(appId);
                if (platforms) {
                    const unique = [...new Set(platforms)];
                    r = r.withIsOwned(true).withOwnedPlatforms(unique);
                }
            }

            return r;
        });

        return enriched;
    }
}
