import 'reflect-metadata';
import { injectable } from 'inversify';
import { IGameRepository } from '../../domain/interfaces/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import {
    MOCK_ALL_GAMES,
    MOCK_STEAM_GAMES,
    MOCK_SEARCH_RESULTS,
    simulateDelay,
} from './MockDataProvider';

/**
 * Mock de IGameRepository.
 *
 * - getLibraryGames: devuelve todos los juegos mock (Steam + Epic)
 * - syncLibrary: simula una sincronización con un delay mayor (operación "lenta")
 * - getGameById: busca en la lista mock por ID
 * - searchGames: filtra MOCK_SEARCH_RESULTS por título
 */
@injectable()
export class MockGameRepository implements IGameRepository {

    async getLibraryGames(_userId: string): Promise<Game[]> {
        await simulateDelay(500);
        return [...MOCK_ALL_GAMES];
    }

    async getGameById(gameId: string): Promise<Game> {
        await simulateDelay(300);
        const game = MOCK_ALL_GAMES.find(g => g.getId() === gameId);
        if (!game) {
            throw new Error(`Juego con ID "${gameId}" no encontrado en los mocks`);
        }
        return game;
    }

    async getOrCreateGameById(gameId: string, steamAppId?: number | null): Promise<Game> {
        await simulateDelay(300);
        const game = MOCK_ALL_GAMES.find(g => g.getId() === gameId);
        if (game) return game;
        
        const gameBySteamId = MOCK_ALL_GAMES.find(g => g.getSteamAppId()?.toString() === steamAppId?.toString());
        if (gameBySteamId) return gameBySteamId;
        
        const searchResult = MOCK_SEARCH_RESULTS.find(r => r.getId() === gameId);
        if (searchResult) {
            return new Game(
                steamAppId?.toString() ?? gameId,
                searchResult.getTitle(),
                '',
                searchResult.getCoverUrl(),
                Platform.STEAM,
                steamAppId ?? null,
                gameId,
                0,
                null,
            );
        }
        
        throw new Error(`Juego con ID "${gameId}" no encontrado.`);
    }

    async syncLibrary(_userId: string, platform: Platform): Promise<Game[]> {
        // Simula una operación lenta de sincronización con la API
        await simulateDelay(1500);
        if (platform === Platform.STEAM) {
            return [...MOCK_STEAM_GAMES];
        }
        // Epic: la sync devuelve los juegos Epic ya almacenados
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

    async storeEpicGames(_userId: string, _games: Game[]): Promise<void> {
        // En mocks, no necesitamos hacer nada especial
        await simulateDelay(100);
    }
}
