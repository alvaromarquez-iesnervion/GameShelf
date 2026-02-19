import { GameDetailDTO } from '../../../dtos/GameDetailDTO';

export interface IGameDetailUseCase {
    /**
     * Orquesta ProtonDB, HLTB, ITAD y wishlist en paralelo con Promise.allSettled.
     * El fallo de cualquier API externa no interrumpe las demás: los campos
     * correspondientes quedan como null en el GameDetail resultante.
     */
    getGameDetail(gameId: string, userId: string): Promise<GameDetailDTO>;
}
