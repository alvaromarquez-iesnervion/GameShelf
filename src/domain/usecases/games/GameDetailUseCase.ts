import { IGameDetailUseCase } from '../../interfaces/usecases/games/IGameDetailUseCase';
import { IGameShelfApiClient } from '../../interfaces/services/IGameShelfApiClient';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { GameDetailDTO } from '../../dtos/GameDetailDTO';

export class GameDetailUseCase implements IGameDetailUseCase {

    constructor(
        private readonly api: IGameShelfApiClient,
        private readonly wishlistRepository: IWishlistRepository,
    ) {}

    async getGameDetail(gameId: string, userId: string, _steamAppId?: number): Promise<GameDetailDTO> {
        const [detailResult, wishlistResult] = await Promise.allSettled([
            this.api.getGameDetail(gameId),
            this.wishlistRepository.isInWishlist(userId, gameId),
        ]);

        if (detailResult.status === 'rejected') throw detailResult.reason;

        const isInWishlist = wishlistResult.status === 'fulfilled' ? wishlistResult.value : false;
        return new GameDetailDTO(detailResult.value, isInWishlist);
    }
}
