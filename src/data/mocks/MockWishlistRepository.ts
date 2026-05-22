import 'reflect-metadata';
import { injectable } from 'inversify';
import { IWishlistRepository } from '../../domain/interfaces/repositories/IWishlistRepository';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { MOCK_INITIAL_WISHLIST, simulateDelay } from './MockDataProvider';

/**
 * In-memory mock implementation of IWishlistRepository.
 *
 * Seeded from MOCK_INITIAL_WISHLIST (Cyberpunk 2077 + BG3).
 * Supports full CRUD: changes persist for the app session
 * but reset on restart (no real persistence).
 */
@injectable()
export class MockWishlistRepository implements IWishlistRepository {

    // Deep copy to avoid mutating MockDataProvider's original array
    private items: WishlistItem[] = MOCK_INITIAL_WISHLIST.map(i =>
        new WishlistItem(
            i.getId(),
            i.getGameId(),
            i.getTitle(),
            i.getCoverUrl(),
            i.getAddedAt(),
            i.getBestDealPercentage(),
        ),
    );

    async getWishlist(_userId: string): Promise<WishlistItem[]> {
        await simulateDelay(500);
        return [...this.items];
    }

    async addToWishlist(_userId: string, item: WishlistItem): Promise<void> {
        await simulateDelay(400);
        const alreadyExists = this.items.some(i => i.getGameId() === item.getGameId());
        if (!alreadyExists) {
            this.items.push(item);
        }
    }

    async removeFromWishlist(_userId: string, itemId: string): Promise<void> {
        await simulateDelay(400);
        this.items = this.items.filter(i => i.getId() !== itemId);
    }

    async isInWishlist(_userId: string, gameId: string): Promise<boolean> {
        await simulateDelay(200);
        return this.items.some(i => i.getGameId() === gameId);
    }

    async getWishlistGameIds(_userId: string): Promise<Set<string>> {
        await simulateDelay(200);
        return new Set(this.items.map(i => i.getGameId()));
    }
}
