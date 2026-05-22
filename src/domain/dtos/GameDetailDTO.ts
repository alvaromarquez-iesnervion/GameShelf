import { GameDetail } from '../entities/GameDetail';

/**
 * Aggregates data from 4 sources (Game, ProtonDB, HLTB, ITAD) + wishlist state.
 * Produced by GameDetailUseCase via Promise.allSettled.
 */
export class GameDetailDTO {
    readonly detail: GameDetail;
    readonly isInWishlist: boolean;

    constructor(detail: GameDetail, isInWishlist: boolean) {
        this.detail = detail;
        this.isInWishlist = isInWishlist;
    }
}
