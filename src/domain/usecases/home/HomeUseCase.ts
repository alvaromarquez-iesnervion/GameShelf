import { IHomeUseCase } from '../../interfaces/usecases/home/IHomeUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { IWishlistRepository } from '../../interfaces/repositories/IWishlistRepository';
import { ISteamApiService } from '../../interfaces/services/ISteamApiService';
import { Game } from '../../entities/Game';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';

export class HomeUseCase implements IHomeUseCase {

    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly platformRepository: IPlatformRepository,
        private readonly wishlistRepository: IWishlistRepository,
        private readonly steamService: ISteamApiService,
    ) {}

    async getPopularGames(limit: number = 10): Promise<Game[]> {
        try {
            return await this.steamService.getMostPlayedGames(limit);
        } catch {
            return [];
        }
    }

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
        // Lee directamente de Firestore sin forzar sync.
        // La sincronización es responsabilidad de LibraryViewModel (botón ↻ en Biblioteca).
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

        // Cargar biblioteca para cruzar ownership
        let libraryGames: Game[] = [];
        try {
            libraryGames = await this.gameRepository.getLibraryGames(userId);
        } catch {
            // Si falla, continuamos sin ownership info
        }

        // Construir mapa de identificadores owned → plataforma para búsqueda O(1)
        const ownedBySteamAppId = new Map<number, Platform>(
            libraryGames
                .filter(g => g.getSteamAppId() !== null)
                .map(g => [g.getSteamAppId() as number, g.getPlatform()]),
        );
        const ownedByGameId = new Map<string, Platform>(
            libraryGames.map(g => [g.getId(), g.getPlatform()]),
        );

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

                // Marcar como owned si el steamAppId o el id coincide con la biblioteca
                const steamAppId = result.getSteamAppId();
                let ownedPlatform: Platform | undefined;
                if (steamAppId !== null) {
                    ownedPlatform = ownedBySteamAppId.get(steamAppId);
                }
                if (!ownedPlatform) {
                    ownedPlatform = ownedByGameId.get(result.getId());
                }
                if (ownedPlatform) {
                    result.setIsOwned(true);
                    result.setOwnedPlatform(ownedPlatform);
                }
            }),
        );

        return results;
    }
}
