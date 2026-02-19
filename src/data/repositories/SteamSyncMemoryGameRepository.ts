import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IGameRepository } from '../../domain/interfaces/repositories/IGameRepository';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { ISteamApiService } from '../../domain/interfaces/services/ISteamApiService';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';

const TEST_USER_ID = 'mock-uid-dev-001';

/**
 * IGameRepository en memoria que sincroniza desde la API real de Steam.
 *
 * Para testing: biblioteca se precarga automáticamente para el usuario de testing.
 */
@injectable()
export class SteamSyncMemoryGameRepository implements IGameRepository {

    private readonly gamesByUser = new Map<string, Game[]>();
    private initialized = false;

    constructor(
        @inject(TYPES.ISteamApiService)
        private readonly steamService: ISteamApiService,
        @inject(TYPES.IPlatformRepository)
        private readonly platformRepository: IPlatformRepository,
        @inject(TYPES.IIsThereAnyDealService)
        private readonly itadService: IIsThereAnyDealService,
    ) {
        this.initializeForTesting();
    }

    private async initializeForTesting(): Promise<void> {
        if (this.initialized) return;
        
        try {
            const linked = await this.platformRepository.getLinkedPlatforms(TEST_USER_ID);
            const steamPlatform = linked.find(p => p.getPlatform() === Platform.STEAM);
            
            if (steamPlatform) {
                const steamGames = await this.steamService.getUserGames(steamPlatform.getExternalUserId());
                this.gamesByUser.set(TEST_USER_ID, steamGames);
            }
            this.initialized = true;
        } catch (error) {
            console.warn('SteamSyncMemoryGameRepository: Could not preload library:', error);
        }
    }

    async getLibraryGames(userId: string): Promise<Game[]> {
        if (!this.initialized) {
            await this.initializeForTesting();
        }
        return [...(this.gamesByUser.get(userId) ?? [])];
    }

    async getGameById(gameId: string): Promise<Game> {
        for (const games of this.gamesByUser.values()) {
            const found = games.find(g => g.getId() === gameId);
            if (found) return found;
        }
        throw new Error(`Juego con ID "${gameId}" no encontrado.`);
    }

    async getOrCreateGameById(gameId: string, steamAppId?: number | null): Promise<Game> {
        try {
            return await this.getGameById(gameId);
        } catch {
            // No está en la biblioteca, crear desde ITAD
            const info = await this.itadService.getGameInfo(gameId);
            if (!info) {
                throw new Error(`No se pudo obtener información del juego "${gameId}".`);
            }
            
            return new Game(
                steamAppId?.toString() ?? gameId,
                info.title,
                '',
                info.coverUrl,
                Platform.STEAM,
                info.steamAppId ?? steamAppId ?? null,
                gameId,
                0,
                null,
            );
        }
    }

    async syncLibrary(userId: string, platform: Platform): Promise<Game[]> {
        if (platform !== Platform.STEAM) {
            // Epic y otras plataformas: devolver lo que ya hay en memoria
            return this.getLibraryGames(userId);
        }

        // Obtener SteamID desde la capa de plataformas
        const linked = await this.platformRepository.getLinkedPlatforms(userId);
        const steamPlatform = linked.find(p => p.getPlatform() === Platform.STEAM);
        if (!steamPlatform) {
            throw new Error('Steam no está vinculado. Vincula tu cuenta primero.');
        }

        // Llamada real a IPlayerService/GetOwnedGames/v1
        const steamGames = await this.steamService.getUserGames(steamPlatform.getExternalUserId());

        // Combinar con juegos de otras plataformas ya en memoria
        const existing = this.gamesByUser.get(userId) ?? [];
        const nonSteam = existing.filter(g => g.getPlatform() !== Platform.STEAM);
        this.gamesByUser.set(userId, [...nonSteam, ...steamGames]);

        return steamGames;
    }

    async searchGames(query: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];
        return this.itadService.searchGames(query);
    }
}
