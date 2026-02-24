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

        // Enriquece en paralelo; errores aislados por item
        await Promise.allSettled(
            items.map(async item => {
                try {
                    const itadId = await this.itadService.lookupGameId(item.getTitle());
                    if (!itadId) return;
                    const deals = await this.itadService.getPricesForGame(itadId);
                    if (deals.length === 0) return;
                    const best = deals.reduce((max, d) =>
                        d.getDiscountPercentage() > max.getDiscountPercentage() ? d : max,
                    );
                    item.setBestDealPercentage(best.getDiscountPercentage());
                } catch {
                    // El item queda con su bestDealPercentage original (null o caché previa)
                }
            }),
        );

        return items;
    }

    async addToWishlist(userId: string, item: WishlistItem): Promise<void> {
        return this.wishlistRepository.addToWishlist(userId, item);
    }

    async removeFromWishlist(userId: string, itemId: string): Promise<void> {
        return this.wishlistRepository.removeFromWishlist(userId, itemId);
    }
}
