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
import { Platform } from '../../enums/Platform';

/**
 * Constructs the full detail of a game by aggregating data from 5 external sources.
 *
 * Strategy: Promise.allSettled — if ProtonDB, HLTB, ITAD or Steam Store fail,
 * the corresponding field is null and the rest of the detail is still shown.
 * Only IGameRepository (Firestore) is critical: its errors propagate.
 *
 * Phase 0 (Epic Games only): If the game is an Epic Games library entry without a
 * known steamAppId, attempt to resolve one so that ProtonDB, Steam screenshots,
 * Metacritic, and other Steam-based data become available. Strategy:
 *   1. If itadGameId is available, ask ITAD for the associated Steam App ID.
 *   2. Fall back to Steam Store Search API (title-based fuzzy match).
 * If a Steam App ID is found, it is persisted in Firestore via updateSteamAppId()
 * so subsequent opens skip this resolution step.
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

        // ── Phase 0: Steam App ID resolution for Epic Games entries ───────────
        if (game.getPlatform() === Platform.EPIC_GAMES && game.getSteamAppId() === null) {
            const resolvedId = await this._resolveEpicSteamAppId(game);
            if (resolvedId !== null) {
                game.setSteamAppId(resolvedId);
                // Persist so next open skips this lookup
                try {
                    await this.gameRepository.updateSteamAppId(userId, game.getId(), resolvedId);
                } catch {
                    // Non-critical: detail still loads with the resolved id in memory
                }
            }
        }

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

    /**
     * Attempts to find a Steam App ID for an Epic Games library entry.
     * Strategy 1: ITAD lookup via getGameInfo (uses itadGameId if already resolved).
     * Strategy 2: Steam Store Search API fuzzy title match.
     */
    private async _resolveEpicSteamAppId(game: Game): Promise<number | null> {
        // Strategy 1: ask ITAD (reliable when the game is on both platforms)
        try {
            let itadId = game.getItadGameId();
            if (!itadId) {
                itadId = await this.itadService.lookupGameId(game.getTitle());
                if (itadId) game.setItadGameId(itadId);
            }
            if (itadId) {
                const info = await this.itadService.getGameInfo(itadId);
                if (info?.steamAppId) return info.steamAppId;
            }
        } catch {
            // Fall through to strategy 2
        }

        // Strategy 2: Steam Store Search (fuzzy title match)
        try {
            return await this.steamApiService.searchSteamAppId(game.getTitle());
        } catch {
            return null;
        }
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
