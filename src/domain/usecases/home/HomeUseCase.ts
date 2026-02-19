import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IHomeUseCase } from '../../interfaces/usecases/home/IHomeUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { ISteamApiService } from '../../interfaces/services/ISteamApiService';
import { Game } from '../../entities/Game';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';
import { TYPES } from '../../../di/types';

@injectable()
export class HomeUseCase implements IHomeUseCase {

    constructor(
        @inject(TYPES.IGameRepository)
        private readonly gameRepository: IGameRepository,
        @inject(TYPES.IPlatformRepository)
        private readonly platformRepository: IPlatformRepository,
        @inject(TYPES.IWishlistRepository)
        private readonly wishlistRepository: IWishlistRepository,
        @inject(TYPES.ISteamApiService)
        private readonly steamService: ISteamApiService,
    ) {}

    async getRecentlyPlayed(userId: string): Promise<Game[]> {
        const platforms = await this.platformRepository.getLinkedPlatforms(userId);
        const steamPlatform = platforms.find(p => p.getPlatform() === Platform.STEAM);
        
        if (!steamPlatform) return [];
        
        const steamId = steamPlatform.getExternalUserId();
        try {
            return await this.steamService.getRecentlyPlayedGames(steamId);
        } catch {
            return [];
        }
    }

    async getMostPlayed(userId: string, limit: number = 5): Promise<Game[]> {
        const games = await this.gameRepository.getLibraryGames(userId);
        return games
            .filter(g => g.getPlaytime() > 0)
            .sort((a, b) => b.getPlaytime() - a.getPlaytime())
            .slice(0, limit);
    }

    async searchGames(query: string, userId: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];

        const results = await this.gameRepository.searchGames(query);
        if (results.length === 0) return results;

        await Promise.allSettled(
            results.map(async result => {
                try {
                    const inWishlist = await this.wishlistRepository.isInWishlist(
                        userId,
                        result.getId(),
                    );
                    result.setIsInWishlist(inWishlist);
                } catch {
                }
            }),
        );

        return results;
    }
}
