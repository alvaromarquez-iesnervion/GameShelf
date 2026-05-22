import { GameDetailDTO } from '../../../dtos/GameDetailDTO';
import { Platform } from '../../../enums/Platform';

export interface IGameDetailUseCase {
    /**
     * Orchestrates ProtonDB, HLTB, ITAD, and wishlist calls in parallel via Promise.allSettled.
     * A failure in any external API does not block the others: the corresponding fields
     * are null in the resulting GameDetail.
     * steamAppId is optional and used when the gameId is an ITAD identifier.
     */
    getGameDetail(gameId: string, userId: string, steamAppId?: number | null, platform?: Platform | null, country?: string): Promise<GameDetailDTO>;
}
