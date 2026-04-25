import { IGameDetailUseCase } from '../../interfaces/usecases/games/IGameDetailUseCase';
import { IGameShelfApiClient } from '../../interfaces/services/IGameShelfApiClient';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { GameDetailDTO } from '../../dtos/GameDetailDTO';
import { Platform } from '../../enums/Platform';

export class GameDetailUseCase implements IGameDetailUseCase {

    constructor(
        private readonly api: IGameShelfApiClient,
        private readonly wishlistRepository: IWishlistRepository,
    ) {}

    async getGameDetail(gameId: string, userId: string, steamAppId?: number | null, platform?: Platform | null): Promise<GameDetailDTO> {
        const [detailResult, wishlistResult] = await Promise.allSettled([
            this.api.getGameDetail(gameId, steamAppId, platform),
            this.wishlistRepository.isInWishlist(userId, gameId),
        ]);

        if (detailResult.status === 'rejected') throw detailResult.reason;

        const isInWishlist = wishlistResult.status === 'fulfilled' ? wishlistResult.value : false;
        return new GameDetailDTO(detailResult.value, isInWishlist);
    }
}
