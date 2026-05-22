import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IWishlistRepository } from '../../domain/interfaces/repositories/IWishlistRepository';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { TYPES } from '../../di/types';

/**
 * IWishlistRepository implementation that delegates to the GameShelfApi backend.
 *
 * _userId is accepted on every method to satisfy the interface contract but is
 * not forwarded — the API derives the user from the session token.
 */
@injectable()
export class GameShelfApiWishlistRepository implements IWishlistRepository {

    constructor(
        @inject(TYPES.IGameShelfApiClient) private api: IGameShelfApiClient,
    ) {}

    async getWishlist(_userId: string, country?: string): Promise<WishlistItem[]> {
        return this.api.getWishlist(country);
    }

    async addToWishlist(_userId: string, item: WishlistItem): Promise<void> {
        await this.api.addToWishlist(item.getGameId(), item.getTitle(), item.getCoverUrl(), item.getPlatform());
    }

    async removeFromWishlist(_userId: string, itemId: string): Promise<void> {
        return this.api.removeFromWishlist(itemId);
    }

    async isInWishlist(_userId: string, gameId: string): Promise<boolean> {
        return this.api.isInWishlist(gameId);
    }

    async getWishlistGameIds(_userId: string, country?: string): Promise<Set<string>> {
        // No dedicated endpoint — derive the id set from a full wishlist fetch.
        const items = await this.api.getWishlist(country);
        return new Set(items.map(i => i.getGameId()));
    }
}
