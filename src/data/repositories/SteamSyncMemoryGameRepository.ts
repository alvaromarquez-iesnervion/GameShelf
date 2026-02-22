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

    async getGameById(gameId: string): Promise<Game> {
        for (const games of this.gamesByUser.values()) {
            const found = games.find(g => g.getId() === gameId);
            if (found) return found;
        }
        throw new Error(`Juego con ID "${gameId}" no encontrado.`);
    }

    async getOrCreateGameById(gameId: string, steamAppId?: number | null): Promise<Game> {
        // 1. Buscar en la biblioteca en memoria (el caso más común para juegos de la biblioteca)
        try {
            return await this.getGameById(gameId);
        } catch { /* no está en memoria — continuar */ }

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
                Platform.STEAM,
                resolvedSteamAppId,
                itadId ?? null,
                0,
                null,
            );
        }

        // 3. El gameId es un ITAD UUID u otro identificador externo
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
}
