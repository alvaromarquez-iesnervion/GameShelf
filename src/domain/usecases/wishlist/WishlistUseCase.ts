import { IWishlistUseCase } from '../../interfaces/usecases/wishlist/IWishlistUseCase';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { WishlistItem } from '../../entities/WishlistItem';

export class WishlistUseCase implements IWishlistUseCase {

    constructor(
        private readonly wishlistRepository: IWishlistRepository,
    ) {}

    async getWishlist(userId: string, country?: string): Promise<WishlistItem[]> {
        if (!userId?.trim()) throw new Error('userId requerido');
        return this.wishlistRepository.getWishlist(userId, country);
    }

    async addToWishlist(userId: string, item: WishlistItem): Promise<void> {
        if (!userId?.trim()) throw new Error('userId requerido');
        const alreadyAdded = await this.wishlistRepository.isInWishlist(userId, item.getGameId());
        if (alreadyAdded) return;
        return this.wishlistRepository.addToWishlist(userId, item);
    }

    async removeFromWishlist(userId: string, itemId: string): Promise<void> {
        if (!userId?.trim()) throw new Error('userId requerido');
        return this.wishlistRepository.removeFromWishlist(userId, itemId);
    }
}
