import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IGameRepository } from '../../domain/interfaces/repositories/IGameRepository';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { ISteamApiService } from '../../domain/interfaces/services/ISteamApiService';
import { IEpicGamesApiService } from '../../domain/interfaces/services/IEpicGamesApiService';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';

/**
 * IGameRepository en memoria que sincroniza desde las APIs reales de Steam y Epic.
 *
 * - Steam: llamadas a IPlayerService/GetOwnedGames/v1
 * - Epic: almacena juegos parseados del export GDPR en memoria
 *
 * Se usa cuando Steam API está activa pero Firebase no está configurado.
 * Los datos se pierden al cerrar la app.
 */
@injectable()
export class SteamSyncMemoryGameRepository implements IGameRepository {

    private readonly gamesByUser = new Map<string, Game[]>();
    private readonly epicGamesByUser = new Map<string, Game[]>();

    constructor(
        @inject(TYPES.ISteamApiService)
        private readonly steamService: ISteamApiService,
        @inject(TYPES.IEpicGamesApiService)
        private readonly epicService: IEpicGamesApiService,
        @inject(TYPES.IPlatformRepository)
        private readonly platformRepository: IPlatformRepository,
        @inject(TYPES.IIsThereAnyDealService)
        private readonly itadService: IIsThereAnyDealService,
    ) {}

    async getLibraryGames(userId: string): Promise<Game[]> {
        return [...(this.gamesByUser.get(userId) ?? [])];
    }

    async getGameById(userId: string, gameId: string): Promise<Game> {
        const games = this.gamesByUser.get(userId) ?? [];
        const found = games.find(g => g.getId() === gameId);
        if (found) return found;
        throw new Error(`Juego con ID "${gameId}" no encontrado en la biblioteca de ${userId}.`);
    }

    async getOrCreateGameById(userId: string, gameId: string, steamAppId?: number | null): Promise<Game> {
        // 1a. Buscar en la biblioteca en memoria por gameId directo
        try {
            return await this.getGameById(userId, gameId);
        } catch { /* no está por ese id — continuar */ }

        // 1b. Si viene steamAppId, buscar en la biblioteca por ese ID
        if (steamAppId != null) {
            const games = this.gamesByUser.get(userId) ?? [];
            const bySteamId = games.find(g => g.getSteamAppId() === steamAppId);
            if (bySteamId) return bySteamId;
        }

        // 2. Si el gameId parece un steamAppId numérico, resolver vía ITAD
        const looksLikeSteamAppId = /^\d+$/.test(gameId);
        if (looksLikeSteamAppId) {
            const resolvedSteamAppId = steamAppId ?? parseInt(gameId, 10);
            const itadId = await this.itadService.lookupGameIdBySteamAppId(gameId);
            const info = itadId ? await this.itadService.getGameInfo(itadId) : null;

            return new Game(
                gameId,
                info?.title ?? '',
                '',
                info?.coverUrl ?? '',
                Platform.UNKNOWN,
                resolvedSteamAppId,
                itadId ?? null,
                0,
                null,
            );
        }

        // 3. El gameId es un ITAD UUID — obtener info y buscar en biblioteca por steamAppId
        const info = await this.itadService.getGameInfo(gameId);
        if (!info) {
            throw new Error(`No se pudo obtener información del juego "${gameId}".`);
        }

        const resolvedSteamAppId = info.steamAppId ?? steamAppId ?? null;

        // 3b. Si ITAD nos da el steamAppId, intentar buscar en la biblioteca una última vez
        if (resolvedSteamAppId != null) {
            const games = this.gamesByUser.get(userId) ?? [];
            const bySteamId = games.find(g => g.getSteamAppId() === resolvedSteamAppId);
            if (bySteamId) return bySteamId;
        }

        return new Game(
            gameId,
            info.title,
            '',
            info.coverUrl,
            Platform.UNKNOWN,
            resolvedSteamAppId,
            gameId,
            0,
            null,
        );
    }

    async syncLibrary(userId: string, platform: Platform): Promise<Game[]> {
        if (platform === Platform.STEAM) {
            // ─── FLUJO STEAM ────────────────────────────────────────────────────
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
        } else if (platform === Platform.EPIC_GAMES) {
            // ─── FLUJO EPIC ─────────────────────────────────────────────────────
            // Obtener juegos Epic que fueron parseados y almacenados temporalmente
            const epicGames = this.epicGamesByUser.get(userId) ?? [];
            
            // Combinar con juegos de otras plataformas ya en memoria
            const existing = this.gamesByUser.get(userId) ?? [];
            const nonEpic = existing.filter(g => g.getPlatform() !== Platform.EPIC_GAMES);
            this.gamesByUser.set(userId, [...nonEpic, ...epicGames]);

            return epicGames;
        } else {
            // Otras plataformas: devolver lo que ya hay
            return this.getLibraryGames(userId);
        }
    }

    /**
     * Almacena juegos Epic parseados en memoria para que syncLibrary() los procese.
     * Llamado internamente desde PlatformLinkUseCase tras parsear el JSON.
     */
    async storeEpicGames(userId: string, games: Game[]): Promise<void> {
        this.epicGamesByUser.set(userId, games);
    }

    async searchGames(query: string): Promise<SearchResult[]> {
        if (!query.trim()) return [];
        return this.itadService.searchGames(query);
    }

    async updateSteamAppId(_userId: string, _gameId: string, _steamAppId: number): Promise<void> {
        // In-memory repository: update the game object directly if present
        const games = this.gamesByUser.get(_userId) ?? [];
        const game = games.find(g => g.getId() === _gameId);
        if (game) game.setSteamAppId(_steamAppId);
    }
}
