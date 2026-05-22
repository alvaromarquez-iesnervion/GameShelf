import { IGameDetailUseCase } from '../../interfaces/usecases/games/IGameDetailUseCase';
import { IGameShelfApiClient } from '../../interfaces/services/IGameShelfApiClient';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { GameDetailDTO } from '../../dtos/GameDetailDTO';
import { Platform } from '../../enums/Platform';

/**
 * Fetches the full detail for a single game and enriches it with the user's wishlist state.
 *
 * Both calls (API detail + wishlist check) run in parallel via Promise.allSettled so that
 * a wishlist failure never blocks the detail view. If the API call itself fails, the error
 * is re-thrown; a missing wishlist result silently defaults to false.
 */
export class GameDetailUseCase implements IGameDetailUseCase {

    constructor(
        private readonly api: IGameShelfApiClient,
        private readonly wishlistRepository: IWishlistRepository,
    ) {}

    async getGameDetail(gameId: string, userId: string, steamAppId?: number | null, platform?: Platform | null, country?: string): Promise<GameDetailDTO> {
        const [detailResult, wishlistResult] = await Promise.allSettled([
            this.api.getGameDetail(gameId, steamAppId, platform, country),
            this.wishlistRepository.isInWishlist(userId, gameId),
        ]);

        if (detailResult.status === 'rejected') throw detailResult.reason;

        const isInWishlist = wishlistResult.status === 'fulfilled' ? wishlistResult.value : false;
        return new GameDetailDTO(detailResult.value, isInWishlist);
    }
}
