import 'reflect-metadata';
import { injectable } from 'inversify';
import { IWishlistRepository } from '../../domain/interfaces/repositories/IWishlistRepository';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { MOCK_INITIAL_WISHLIST, simulateDelay } from './MockDataProvider';

/**
 * Mock de IWishlistRepository con estado en memoria.
 *
 * Parte de MOCK_INITIAL_WISHLIST (Cyberpunk 2077 + BG3).
 * Soporta CRUD completo: los cambios persisten durante la sesión de la app
 * pero se resetean al reiniciar (no hay persistencia real).
 */
@injectable()
export class MockWishlistRepository implements IWishlistRepository {

    // Copia profunda para no mutar el array original de MockDataProvider
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
}
