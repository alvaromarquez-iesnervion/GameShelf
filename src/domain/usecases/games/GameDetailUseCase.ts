import { IGameDetailUseCase } from '../../interfaces/usecases/games/IGameDetailUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { IProtonDbService } from '../../interfaces/services/IProtonDbService';
import { IHowLongToBeatService } from '../../interfaces/services/IHowLongToBeatService';
import { IIsThereAnyDealService } from '../../interfaces/services/IIsThereAnyDealService';
import { ISteamApiService } from '../../interfaces/services/ISteamApiService';
import { Game } from '../../entities/Game';
import { GameDetail } from '../../entities/GameDetail';
import { GameDetailDTO } from '../../dtos/GameDetailDTO';

/**
 * Constructs the full detail of a game by aggregating data from 5 external sources.
 *
 * Strategy: Promise.allSettled — if ProtonDB, HLTB, ITAD or Steam Store fail,
 * the corresponding field is null and the rest of the detail is still shown.
 * Only IGameRepository (Firestore) is critical: its errors propagate.
 */
export class GameDetailUseCase implements IGameDetailUseCase {

    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly wishlistRepository: IWishlistRepository,
        private readonly protonDbService: IProtonDbService,
        private readonly hltbService: IHowLongToBeatService,
        private readonly itadService: IIsThereAnyDealService,
        private readonly steamApiService: ISteamApiService,
    ) {}

    async getGameDetail(gameId: string, userId: string, providedSteamAppId?: number): Promise<GameDetailDTO> {
        const game = await this.gameRepository.getOrCreateGameById(userId, gameId, providedSteamAppId);

        const steamAppId = game.getSteamAppId();

        const [protonResult, hltbResult, dealsResult, wishlistResult, steamMetaResult] =
            await Promise.allSettled([
                steamAppId
                    ? this.protonDbService.getCompatibilityRating(String(steamAppId))
                    : Promise.resolve(null),
                this.hltbService.getGameDuration(game.getTitle()),
                this._fetchDeals(game),
                this.wishlistRepository.isInWishlist(userId, gameId),
                steamAppId
                    ? this.steamApiService.getSteamAppDetails(steamAppId)
                    : Promise.resolve(null),
            ]);

        const protonRating   = protonResult.status      === 'fulfilled' ? protonResult.value      : null;
        const hltb           = hltbResult.status        === 'fulfilled' ? hltbResult.value        : null;
        const deals          = dealsResult.status       === 'fulfilled' ? dealsResult.value       : [];
        const isInWishlist   = wishlistResult.status    === 'fulfilled' ? wishlistResult.value    : false;
        const steamMetadata  = steamMetaResult.status   === 'fulfilled' ? steamMetaResult.value   : null;

        const detail = new GameDetail(
            game,
            protonRating?.getTier()         ?? null,
            protonRating?.getTrendingTier() ?? null,
            protonRating?.getTotal()        ?? null,
            hltb?.getMain()                 ?? null,
            hltb?.getMainExtra()            ?? null,
            hltb?.getCompletionist()        ?? null,
            deals,
            steamMetadata,
        );

        return new GameDetailDTO(detail, isInWishlist);
    }

    /** Resolves the itadGameId (from cache or lookup) and fetches prices. */
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
