import { WishlistItem } from '../../../entities/WishlistItem';

export interface IWishlistUseCase {
    /**
     * Returns the enriched wishlist: each item includes an updated bestDealPercentage
     * fetched from ITAD (lookupGameId + getPricesForGame).
     */
    getWishlist(userId: string, country?: string): Promise<WishlistItem[]>;
    addToWishlist(userId: string, item: WishlistItem): Promise<void>;
    removeFromWishlist(userId: string, itemId: string): Promise<void>;
}
