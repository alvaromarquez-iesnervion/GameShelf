import { WishlistItem } from '../../entities/WishlistItem';

export interface IWishlistRepository {
    getWishlist(userId: string, country?: string): Promise<WishlistItem[]>;
    addToWishlist(userId: string, item: WishlistItem): Promise<void>;
    removeFromWishlist(userId: string, itemId: string): Promise<void>;
    /** Used in search and detail views to set the isInWishlist flag. */
    isInWishlist(userId: string, gameId: string): Promise<boolean>;
    /** Returns a Set of gameIds in the wishlist. More efficient for batch checks. */
    getWishlistGameIds(userId: string, country?: string): Promise<Set<string>>;
}
