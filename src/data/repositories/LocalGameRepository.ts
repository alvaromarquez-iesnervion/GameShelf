import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IGameRepository } from '../../domain/interfaces/repositories/IGameRepository';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { ISteamApiService } from '../../domain/interfaces/services/ISteamApiService';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';
import { GUEST_KEY_LIBRARY } from '../../core/utils/guestUtils';

interface StoredGame {
    id: string;
    title: string;
    description: string;
    coverUrl: string;
    portraitCoverUrl: string;
    platform: Platform;
    steamAppId: number | null;
    itadGameId: string | null;
    playtime: number;
    lastPlayed: string | null;
}

@injectable()
export class LocalGameRepository implements IGameRepository {

    constructor(
        @inject(TYPES.LocalPlatformRepository)
        private readonly platformRepository: IPlatformRepository,
        @inject(TYPES.ISteamApiService)
        private readonly steamService: ISteamApiService,
        @inject(TYPES.IIsThereAnyDealService)
        private readonly itadService: IIsThereAnyDealService,
    ) {}

    // ── Serialization ─────────────────────────────────────────────────────────

    private toStored(game: Game): StoredGame {
        return {
            id: game.getId(),
            title: game.getTitle(),
            description: game.getDescription(),
            coverUrl: game.getCoverUrl(),
            portraitCoverUrl: game.getPortraitCoverUrl(),
            platform: game.getPlatform(),
            steamAppId: game.getSteamAppId(),
            itadGameId: game.getItadGameId(),
            playtime: game.getPlaytime(),
            lastPlayed: game.getLastPlayed()?.toISOString() ?? null,
        };
    }

    private fromStored(s: StoredGame): Game {
        return new Game(
            s.id, s.title, s.description, s.coverUrl, s.platform,
            s.steamAppId, s.itadGameId, s.playtime,
            s.lastPlayed ? new Date(s.lastPlayed) : null,
            s.portraitCoverUrl,
        );
    }

    private async readAll(): Promise<Game[]> {
        const raw = await AsyncStorage.getItem(GUEST_KEY_LIBRARY);
        if (!raw) return [];
        return (JSON.parse(raw) as StoredGame[]).map(s => this.fromStored(s));
    }

    private async writeAll(games: Game[]): Promise<void> {
        await AsyncStorage.setItem(GUEST_KEY_LIBRARY, JSON.stringify(games.map(g => this.toStored(g))));
    }

    // ── IGameRepository ───────────────────────────────────────────────────────

    async getLibraryGames(_userId: string): Promise<Game[]> {
        return this.readAll();
    }

    async getGameById(_userId: string, gameId: string): Promise<Game> {
        const games = await this.readAll();
        const found = games.find(g => g.getId() === gameId);
        if (!found) throw new Error(`Juego ${gameId} no encontrado en la biblioteca local.`);
        return found;
    }

    async getOrCreateGameById(_userId: string, gameId: string, steamAppId?: number | null): Promise<Game> {
        // 1. Buscar por gameId en biblioteca local
        const games = await this.readAll();
        const byId = games.find(g => g.getId() === gameId);
        if (byId) return byId;

        // 2. Buscar por steamAppId en biblioteca local
        if (steamAppId != null) {
            const bySteam = games.find(g => g.getSteamAppId() === steamAppId);
            if (bySteam) return bySteam;
        }

        // 3. Resolver via ITAD
        const looksLikeSteamAppId = /^\d+$/.test(gameId);
        if (looksLikeSteamAppId) {
            const resolvedSteamAppId = steamAppId ?? parseInt(gameId, 10);
            const itadId = await this.itadService.lookupGameIdBySteamAppId(gameId);
            const info = itadId ? await this.itadService.getGameInfo(itadId) : null;
            return new Game(
                gameId, info?.title ?? '', '', info?.coverUrl ?? '', Platform.UNKNOWN,
                resolvedSteamAppId, itadId ?? null, 0, null,
            );
        }

        // 4. ITAD UUID directo
        const info = await this.itadService.getGameInfo(gameId);
        if (!info) throw new Error(`No se pudo obtener información del juego "${gameId}".`);
        const resolvedSteamAppId = info.steamAppId ?? steamAppId ?? null;
        if (resolvedSteamAppId != null) {
            const bySteam = games.find(g => g.getSteamAppId() === resolvedSteamAppId);
            if (bySteam) return bySteam;
        }
        return new Game(gameId, info.title, '', info.coverUrl, Platform.UNKNOWN,
            resolvedSteamAppId, gameId, 0, null);
    }

    async syncLibrary(_userId: string, platform: Platform): Promise<Game[]> {
        if (platform === Platform.STEAM) {
            const linked = await this.platformRepository.getLinkedPlatforms(_userId);
            const steamPlatform = linked.find(p => p.getPlatform() === Platform.STEAM);
            if (!steamPlatform) return [];
            const steamGames = await this.steamService.getUserGames(steamPlatform.getExternalUserId());
            const existing = await this.readAll();
            const nonSteam = existing.filter(g => g.getPlatform() !== Platform.STEAM);
            await this.writeAll([...nonSteam, ...steamGames]);
            return steamGames;
        } else if (platform === Platform.EPIC_GAMES) {
            const all = await this.readAll();
            return all.filter(g => g.getPlatform() === Platform.EPIC_GAMES);
        }
        return this.readAll();
    }

    // searchGames is never called on LocalGameRepository —
    // GuestAwareGameRepository always delegates searchGames to the Firestore repo.
    searchGames(_query: string): Promise<SearchResult[]> {
        return Promise.resolve([]);
    }

    async storeEpicGames(_userId: string, games: Game[]): Promise<void> {
        const existing = await this.readAll();
        const nonEpic = existing.filter(g => g.getPlatform() !== Platform.EPIC_GAMES);
        await this.writeAll([...nonEpic, ...games]);
    }

    async updateSteamAppId(_userId: string, gameId: string, steamAppId: number): Promise<void> {
        const games = await this.readAll();
        const updated = games.map(g => {
            if (g.getId() === gameId) g.setSteamAppId(steamAppId);
            return g;
        });
        await this.writeAll(updated);
    }
}
