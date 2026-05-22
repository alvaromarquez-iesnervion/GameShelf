import { SearchResult } from '../../../entities/SearchResult';

export interface ISearchUseCase {
    /**
     * Searches the global catalogue via IGameRepository (ITAD) and cross-references
     * the results with IWishlistRepository.isInWishlist to set the flag on each SearchResult.
     */
    searchGames(query: string, userId: string): Promise<SearchResult[]>;
}
