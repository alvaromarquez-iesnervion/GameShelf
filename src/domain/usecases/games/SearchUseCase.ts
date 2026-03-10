import { ISearchUseCase } from '../../interfaces/usecases/games/ISearchUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';

/**
 * Búsqueda en el catálogo global de ITAD.
 *
 * Cruza los resultados con:
 *   - IWishlistRepository para marcar isInWishlist.
 *   - IGameRepository.getLibraryGames para marcar isOwned + ownedPlatforms.
 *
 * La biblioteca y la wishlist se cargan en paralelo con la búsqueda para
 * minimizar la latencia total.
 */
export class SearchUseCase implements ISearchUseCase {

    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly wishlistRepository: IWishlistRepository,
    ) {}

    async searchGames(query: string, userId: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];

        const [results, libraryGames, wishlistGameIds] = await Promise.all([
            this.gameRepository.searchGames(query),
            this.gameRepository.getLibraryGames(userId).catch(() => []),
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

        results.forEach(result => {
            if (wishlistGameIds.has(result.getId())) {
                result.setIsInWishlist(true);
            }

            const appId = result.getSteamAppId();
            if (appId !== null) {
                const platforms = steamAppIdToPlatforms.get(appId);
                if (platforms) {
                    result.setIsOwned(true);
                    platforms.forEach(p => result.addOwnedPlatform(p));
                }
            }
        });

        return results;
    }
}
