import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IGameDetailUseCase } from '../../interfaces/usecases/games/IGameDetailUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { IProtonDbService } from '../../interfaces/services/IProtonDbService';
import { IHowLongToBeatService } from '../../interfaces/services/IHowLongToBeatService';
import { IIsThereAnyDealService } from '../../interfaces/services/IIsThereAnyDealService';
import { Game } from '../../entities/Game';
import { GameDetail } from '../../entities/GameDetail';
import { GameDetailDTO } from '../../dtos/GameDetailDTO';
import { TYPES } from '../../../di/types';

/**
 * Construye el detalle completo de un juego agregando datos de 4 fuentes externas.
 *
 * Estrategia: Promise.allSettled — si ProtonDB, HLTB o ITAD fallan, el campo
 * correspondiente queda null y el resto del detalle se muestra igualmente.
 * Solo IGameRepository (Firestore) es crítico: si falla, se propaga el error.
 */
@injectable()
export class GameDetailUseCase implements IGameDetailUseCase {

    constructor(
        @inject(TYPES.IGameRepository)
        private readonly gameRepository: IGameRepository,
        @inject(TYPES.IWishlistRepository)
        private readonly wishlistRepository: IWishlistRepository,
        @inject(TYPES.IProtonDbService)
        private readonly protonDbService: IProtonDbService,
        @inject(TYPES.IHowLongToBeatService)
        private readonly hltbService: IHowLongToBeatService,
        @inject(TYPES.IIsThereAnyDealService)
        private readonly itadService: IIsThereAnyDealService,
    ) {}

    async getGameDetail(gameId: string, userId: string): Promise<GameDetailDTO> {
        // 1. Juego base: crítico. Si falla, se propaga.
        const game = await this.gameRepository.getGameById(gameId);

        // 2. Consultas paralelas a servicios externos (ninguna es crítica)
        const steamAppId = game.getSteamAppId();
        const [protonResult, hltbResult, dealsResult, wishlistResult] =
            await Promise.allSettled([
                steamAppId
                    ? this.protonDbService.getCompatibilityRating(String(steamAppId))
                    : Promise.resolve(null),
                this.hltbService.getGameDuration(game.getTitle()),
                this._fetchDeals(game),
                this.wishlistRepository.isInWishlist(userId, gameId),
            ]);

        // 3. Extraer valores de forma segura (fulfilled → valor, rejected → null/[])
        const protonRating  = protonResult.status  === 'fulfilled' ? protonResult.value  : null;
        const hltb          = hltbResult.status    === 'fulfilled' ? hltbResult.value    : null;
        const deals         = dealsResult.status   === 'fulfilled' ? dealsResult.value   : [];
        const isInWishlist  = wishlistResult.status === 'fulfilled' ? wishlistResult.value : false;

        const detail = new GameDetail(
            game,
            protonRating?.getTier()         ?? null,
            protonRating?.getTrendingTier() ?? null,
            hltb?.getMain()                 ?? null,
            hltb?.getMainExtra()            ?? null,
            hltb?.getCompletionist()        ?? null,
            deals,
        );

        return new GameDetailDTO(detail, isInWishlist);
    }

    /** Resuelve el itadGameId (desde caché o lookup) y obtiene los precios. */
    private async _fetchDeals(game: Game) {
        let itadId = game.getItadGameId();

        if (!itadId) {
            const steamAppId = game.getSteamAppId();
            itadId = steamAppId
                ? await this.itadService.lookupGameIdBySteamAppId(String(steamAppId))
                : await this.itadService.lookupGameId(game.getTitle());

            if (itadId) {
                game.setItadGameId(itadId);
            }
        }

        return itadId ? this.itadService.getPricesForGame(itadId) : [];
    }
}
