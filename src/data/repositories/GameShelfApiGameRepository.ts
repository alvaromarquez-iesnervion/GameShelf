import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IGameRepository, LibraryPage } from '../../domain/interfaces/repositories/IGameRepository';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';
import { Game } from '../../domain/entities/Game';
import { LibraryStats } from '../../domain/entities/LibraryStats';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { LibraryTab } from '../../domain/enums/LibraryTab';
import { SortCriteria } from '../../domain/enums/SortCriteria';
import { TYPES } from '../../di/types';

@injectable()
export class GameShelfApiGameRepository implements IGameRepository {

    constructor(
        @inject(TYPES.IGameShelfApiClient) private api: IGameShelfApiClient,
    ) {}

    async getLibraryGames(_userId: string): Promise<Game[]> {
        const page = await this.api.getLibraryGamesPage(500);
        return page.games.map(g => g.game);
    }

    async getLibraryGamesPage(
        _userId: string,
        pageSize: number,
        page?: number,
        tab?: LibraryTab,
        sortCriteria?: SortCriteria,
        searchQuery?: string,
        platforms?: Platform[],
    ): Promise<LibraryPage> {
        return this.api.getLibraryGamesPage(pageSize, page, tab, sortCriteria, searchQuery, platforms);
    }

    async getGameById(_userId: string, gameId: string): Promise<Game> {
        return this.api.getOrCreateGame(gameId);
    }

    async getOrCreateGameById(_userId: string, gameId: string, steamAppId?: number | null): Promise<Game> {
        return this.api.getOrCreateGame(gameId, steamAppId);
    }

    async syncLibrary(_userId: string, platform: Platform): Promise<Game[]> {
        return this.api.syncLibrary(platform);
    }

    async searchGames(query: string): Promise<SearchResult[]> {
        return this.api.searchGames(query);
    }

    // These operations are handled server-side — no-op on the client.
    async storeEpicGames(_userId: string, _games: Game[]): Promise<void> {}
    async storePsnGames(_userId: string, _games: Game[]): Promise<void> {}
    async updateSteamAppId(_userId: string, _gameId: string, _steamAppId: number): Promise<void> {}

    async getOwnedDlcsForGame(_userId: string, parentGameId: string): Promise<Game[]> {
        return this.api.getOwnedDlcs(parentGameId);
    }

    async getLibraryStats(_userId: string): Promise<LibraryStats> {
        return this.api.getLibraryStats();
    }
}
