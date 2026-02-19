import { SearchResult } from '../../../entities/SearchResult';

export interface ISearchUseCase {
    /**
     * Busca en el catálogo global via IGameRepository (ITAD) y cruza el resultado
     * con IWishlistRepository.isInWishlist para marcar el flag en cada SearchResult.
     */
    searchGames(query: string, userId: string): Promise<SearchResult[]>;
}
