import { ISearchUseCase } from '../../interfaces/usecases/games/ISearchUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { SearchResult } from '../../entities/SearchResult';

/**
 * Búsqueda en el catálogo global de ITAD.
 *
 * Cruza los resultados con IWishlistRepository.isInWishlist para marcar
 * el flag isInWishlist en cada SearchResult. Las comprobaciones de wishlist
 * se ejecutan en paralelo para minimizar la latencia total.
 */
export class SearchUseCase implements ISearchUseCase {

    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly wishlistRepository: IWishlistRepository,
    ) {}

    async searchGames(query: string, userId: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];

        const results = await this.gameRepository.searchGames(query);
        if (results.length === 0) return results;

        // Obtener Set de wishlist IDs en una sola llamada
        try {
            const wishlistGameIds = await this.wishlistRepository.getWishlistGameIds(userId);
            results.forEach(result => {
                if (wishlistGameIds.has(result.getId())) {
                    result.setIsInWishlist(true);
                }
            });
        } catch {
            // Si falla, mantiene el valor por defecto (false) en todos los resultados
        }

        return results;
    }
}
