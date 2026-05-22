import { IWishlistUseCase } from '../../interfaces/usecases/wishlist/IWishlistUseCase';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { WishlistItem } from '../../entities/WishlistItem';

/**
 * Manages the user's game wishlist.
 *
 * addToWishlist is idempotent: it checks existence before writing so duplicate
 * entries are silently ignored without throwing.
 */
export class WishlistUseCase implements IWishlistUseCase {

    constructor(
        private readonly wishlistRepository: IWishlistRepository,
    ) {}

    /** Returns all wishlist items for the user, optionally with prices for the given country. */
    async getWishlist(userId: string, country?: string): Promise<WishlistItem[]> {
        if (!userId?.trim()) throw new Error('userId is required');
        return this.wishlistRepository.getWishlist(userId, country);
    }

    /** Adds a game to the wishlist. No-ops silently if the game is already present. */
    async addToWishlist(userId: string, item: WishlistItem): Promise<void> {
        if (!userId?.trim()) throw new Error('userId is required');
        const alreadyAdded = await this.wishlistRepository.isInWishlist(userId, item.getGameId());
        if (alreadyAdded) return;
        return this.wishlistRepository.addToWishlist(userId, item);
    }

    /** Removes a game from the wishlist by its itemId. */
    async removeFromWishlist(userId: string, itemId: string): Promise<void> {
        if (!userId?.trim()) throw new Error('userId is required');
        return this.wishlistRepository.removeFromWishlist(userId, itemId);
    }
}
