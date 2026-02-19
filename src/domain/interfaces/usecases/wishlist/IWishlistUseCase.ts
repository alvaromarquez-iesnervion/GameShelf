import { WishlistItem } from '../../../entities/WishlistItem';

export interface IWishlistUseCase {
    /**
     * Devuelve la wishlist enriquecida: cada item incluye bestDealPercentage
     * actualizado consultando ITAD (lookupGameId + getPricesForGame).
     */
    getWishlist(userId: string): Promise<WishlistItem[]>;
    addToWishlist(userId: string, item: WishlistItem): Promise<void>;
    removeFromWishlist(userId: string, itemId: string): Promise<void>;
}
