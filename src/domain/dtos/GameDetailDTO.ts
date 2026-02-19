import { GameDetail } from '../entities/GameDetail';

/**
 * Agrega datos de 4 fuentes (Game, ProtonDB, HLTB, ITAD) + estado de wishlist.
 * Producido por GameDetailUseCase mediante Promise.allSettled.
 */
export class GameDetailDTO {
    readonly detail: GameDetail;
    readonly isInWishlist: boolean;

    constructor(detail: GameDetail, isInWishlist: boolean) {
        this.detail = detail;
        this.isInWishlist = isInWishlist;
    }
}
