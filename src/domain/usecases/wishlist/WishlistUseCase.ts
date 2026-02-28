import { IWishlistUseCase } from '../../interfaces/usecases/wishlist/IWishlistUseCase';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { IIsThereAnyDealService } from '../../interfaces/services/IIsThereAnyDealService';
import { WishlistItem } from '../../entities/WishlistItem';

/**
 * Gestiona la wishlist del usuario.
 *
 * getWishlist enriquece cada item con el porcentaje de descuento más alto
 * activo consultando ITAD. El enriquecimiento se hace en paralelo; si ITAD
 * falla para un item concreto, su bestDealPercentage queda como null.
 */
export class WishlistUseCase implements IWishlistUseCase {

    constructor(
        private readonly wishlistRepository: IWishlistRepository,
        private readonly itadService: IIsThereAnyDealService,
    ) {}

    async getWishlist(userId: string): Promise<WishlistItem[]> {
        const items = await this.wishlistRepository.getWishlist(userId);

        if (items.length === 0) return items;

        try {
            // 1. Batch lookup de todos los títulos
            const titles = items.map(item => item.getTitle());
            const titleToItadId = await this.itadService.lookupGameIdsBatch(titles);

            // 2. Recolectar IDs válidos
            const validItadIds = Array.from(titleToItadId.values()).filter(id => id !== null) as string[];
            
            if (validItadIds.length === 0) return items;

            // 3. Batch prices para todos los IDs
            const itadIdToPrices = await this.itadService.getPricesForGamesBatch(validItadIds);

            // 4. Asignar mejores deals a cada item
            items.forEach(item => {
                const itadId = titleToItadId.get(item.getTitle());
                if (!itadId) return;

                const deals = itadIdToPrices.get(itadId) ?? [];
                if (deals.length === 0) return;

                const best = deals.reduce((max, d) =>
                    d.getDiscountPercentage() > max.getDiscountPercentage() ? d : max,
                );
                item.setBestDealPercentage(best.getDiscountPercentage());
            });
        } catch {
            // Si falla el batch completo, los items quedan con bestDealPercentage original
        }

        return items;
    }

    async addToWishlist(userId: string, item: WishlistItem): Promise<void> {
        return this.wishlistRepository.addToWishlist(userId, item);
    }

    async removeFromWishlist(userId: string, itemId: string): Promise<void> {
        return this.wishlistRepository.removeFromWishlist(userId, itemId);
    }
}
