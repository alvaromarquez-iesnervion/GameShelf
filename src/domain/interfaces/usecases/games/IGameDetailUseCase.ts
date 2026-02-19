import { GameDetailDTO } from '../../../dtos/GameDetailDTO';

export interface IGameDetailUseCase {
    /**
     * Orquesta ProtonDB, HLTB, ITAD y wishlist en paralelo con Promise.allSettled.
     * El fallo de cualquier API externa no interrumpe las demás: los campos
     * correspondientes quedan como null en el GameDetail resultante.
     * steamAppId es opcional y se usa cuando el gameId es de ITAD.
     */
    getGameDetail(gameId: string, userId: string, steamAppId?: number): Promise<GameDetailDTO>;
}
