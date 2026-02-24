import { IGameDetailUseCase } from '../../interfaces/usecases/games/IGameDetailUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { IProtonDbService } from '../../interfaces/services/IProtonDbService';
import { IHowLongToBeatService } from '../../interfaces/services/IHowLongToBeatService';
import { IIsThereAnyDealService } from '../../interfaces/services/IIsThereAnyDealService';
import { Game } from '../../entities/Game';
import { GameDetail } from '../../entities/GameDetail';
import { GameDetailDTO } from '../../dtos/GameDetailDTO';

/**
 * Construye el detalle completo de un juego agregando datos de 4 fuentes externas.
 *
 * Estrategia: Promise.allSettled — si ProtonDB, HLTB o ITAD fallan, el campo
 * correspondiente queda null y el resto del detalle se muestra igualmente.
 * Solo IGameRepository (Firestore) es crítico: si falla, se propaga el error.
 */
export class GameDetailUseCase implements IGameDetailUseCase {

    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly wishlistRepository: IWishlistRepository,
        private readonly protonDbService: IProtonDbService,
        private readonly hltbService: IHowLongToBeatService,
        private readonly itadService: IIsThereAnyDealService,
    ) {}

    async getGameDetail(gameId: string, userId: string, providedSteamAppId?: number): Promise<GameDetailDTO> {
        const game = await this.gameRepository.getOrCreateGameById(userId, gameId, providedSteamAppId);

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
