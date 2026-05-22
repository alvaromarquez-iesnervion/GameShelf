import 'reflect-metadata';
import { injectable } from 'inversify';
import { IGameRepository, LibraryPage } from '../../domain/interfaces/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { LibraryStats } from '../../domain/entities/LibraryStats';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { LibraryTab } from '../../domain/enums/LibraryTab';
import { SortCriteria } from '../../domain/enums/SortCriteria';
import {
    MOCK_ALL_GAMES,
    MOCK_STEAM_GAMES,
    MOCK_SEARCH_RESULTS,
    simulateDelay,
} from './MockDataProvider';

/**
 * Mock implementation of IGameRepository.
 *
 * - getLibraryGames: returns all mock games (Steam + Epic)
 * - syncLibrary: simulates a sync with a longer delay (slow operation)
 * - getGameById: searches the mock list by ID
 * - searchGames: filters MOCK_SEARCH_RESULTS by title
 */
@injectable()
export class MockGameRepository implements IGameRepository {

    async getLibraryGames(_userId: string): Promise<Game[]> {
        await simulateDelay(500);
        return [...MOCK_ALL_GAMES];
    }

    async getGameById(userId: string, gameId: string): Promise<Game> {
        await simulateDelay(300);
        // In mocks, the "user library" is MOCK_ALL_GAMES (no per-userId separation)
        const game = MOCK_ALL_GAMES.find(g => g.getId() === gameId);
        if (!game) {
            throw new Error(`Juego con ID "${gameId}" no encontrado en los mocks`);
        }
        return game;
    }

    async getOrCreateGameById(userId: string, gameId: string, steamAppId?: number | null): Promise<Game> {
        await simulateDelay(300);

        // 1. Search the library by direct ID
        const gameById = MOCK_ALL_GAMES.find(g => g.getId() === gameId);
        if (gameById) return gameById;

        // 2. Search the library by steamAppId (gameId may be an ITAD UUID)
        if (steamAppId != null) {
            const gameBySteamId = MOCK_ALL_GAMES.find(g => g.getSteamAppId() === steamAppId);
            if (gameBySteamId) return gameBySteamId;
        }

        // 3. Game not in library: resolve from ITAD with Platform.UNKNOWN
        const searchResult = MOCK_SEARCH_RESULTS.find(r => r.getId() === gameId);
        if (searchResult) {
            return new Game(
                gameId,
                searchResult.getTitle(),
                '',
                searchResult.getCoverUrl(),
                Platform.UNKNOWN,
                steamAppId ?? null,
                gameId,
                0,
                null,
            );
        }

        throw new Error(`Juego con ID "${gameId}" no encontrado.`);
    }

    async syncLibrary(_userId: string, platform: Platform): Promise<Game[]> {
        // Simulate a slow API sync operation
        await simulateDelay(1500);
        if (platform === Platform.STEAM) {
            return [...MOCK_STEAM_GAMES];
        }
        // Epic: sync returns the already-stored Epic games
        return MOCK_ALL_GAMES.filter(g => g.getPlatform() === Platform.EPIC_GAMES);
    }

    async searchGames(query: string): Promise<SearchResult[]> {
        await simulateDelay(600);
        if (!query.trim()) return [];
        const lower = query.toLowerCase();
        return MOCK_SEARCH_RESULTS.filter(r =>
            r.getTitle().toLowerCase().includes(lower),
        );
    }

    async getLibraryGamesPage(_userId: string, _pageSize: number, _page?: number, _tab?: LibraryTab, _sortCriteria?: SortCriteria, _searchQuery?: string, _platforms?: Platform[]): Promise<LibraryPage> {
        const games = await this.getLibraryGames(_userId);
        return { 
            games: games.map(g => ({ game: g, platforms: [g.getPlatform()] })), 
            total: games.length, 
            hasMore: false, 
            currentPage: _page ?? 1 
        };
    }

    async storeEpicGames(_userId: string, _games: Game[]): Promise<void> {
        // No-op in mocks
        await simulateDelay(100);
    }

    async storePsnGames(_userId: string, _games: Game[]): Promise<void> {
        await simulateDelay(100);
    }

    async updateSteamAppId(_userId: string, _gameId: string, _steamAppId: number): Promise<void> {
        // No-op in mocks
    }

    async getOwnedDlcsForGame(_userId: string, _parentGameId: string): Promise<Game[]> {
        return [];
    }

    async getLibraryStats(_userId: string): Promise<LibraryStats> {
        return new LibraryStats(0, 0, 0, 0);
    }

}
