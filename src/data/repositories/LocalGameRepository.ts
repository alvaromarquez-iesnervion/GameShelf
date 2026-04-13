import 'reflect-metadata';
import { injectable } from 'inversify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IGameRepository, LibraryPage } from '../../domain/interfaces/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { GameType } from '../../domain/enums/GameType';
import { GUEST_KEY_LIBRARY } from '../../domain/utils/guestUtils';

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

    private _cache: Game[] | null = null;

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
        if (this._cache !== null) return this._cache;
        const raw = await AsyncStorage.getItem(GUEST_KEY_LIBRARY);
        this._cache = raw ? (JSON.parse(raw) as StoredGame[]).map(s => this.fromStored(s)) : [];
        return this._cache;
    }

    private async writeAll(games: Game[]): Promise<void> {
        this._cache = null;
        await AsyncStorage.setItem(GUEST_KEY_LIBRARY, JSON.stringify(games.map(g => this.toStored(g))));
    }

    // ── IGameRepository ───────────────────────────────────────────────────────

    async getLibraryGames(_userId: string): Promise<Game[]> {
        return this.readAll();
    }

    async getLibraryGamesPage(_userId: string, _pageSize: number, _cursor?: string): Promise<LibraryPage> {
        // La biblioteca local (modo invitado) es siempre pequeña — se devuelve completa en una página.
        return { games: await this.readAll(), nextCursor: null };
    }

    async getGameById(_userId: string, gameId: string): Promise<Game> {
        const games = await this.readAll();
        const found = games.find(g => g.getId() === gameId);
        if (!found) throw new Error(`Juego ${gameId} no encontrado en la biblioteca local.`);
        return found;
    }

    async getOrCreateGameById(_userId: string, gameId: string, steamAppId?: number | null): Promise<Game> {
        const games = await this.readAll();
        const byId = games.find(g => g.getId() === gameId);
        if (byId) return byId;
        if (steamAppId != null) {
            const bySteam = games.find(g => g.getSteamAppId() === steamAppId);
            if (bySteam) return bySteam;
        }
        // En modo invitado no hay acceso al catálogo externo — devolver stub vacío.
        return new Game(gameId, '', '', '', Platform.UNKNOWN, steamAppId ?? null, null, 0, null);
    }

    async syncLibrary(_userId: string, _platform: Platform): Promise<Game[]> {
        // Los invitados no pueden sincronizar plataformas externas.
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

    async storePsnGames(_userId: string, games: Game[]): Promise<void> {
        const existing = await this.readAll();
        const nonPsn = existing.filter(g => g.getPlatform() !== Platform.PSN);
        await this.writeAll([...nonPsn, ...games]);
    }

    async updateSteamAppId(_userId: string, gameId: string, steamAppId: number): Promise<void> {
        const games = await this.readAll();
        const updated = games.map(g =>
            g.getId() === gameId ? g.withSteamAppId(steamAppId) : g,
        );
        await this.writeAll(updated);
    }

    async getOwnedDlcsForGame(_userId: string, parentGameId: string): Promise<Game[]> {
        const games = await this.readAll();
        return games.filter(g => g.getGameType() === GameType.DLC && g.getParentGameId() === parentGameId);
    }

}
