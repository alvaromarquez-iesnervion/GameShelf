import 'reflect-metadata';
import { injectable } from 'inversify';
import { IEpicGamesApiService } from '../../domain/interfaces/services/IEpicGamesApiService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { EpicAuthToken } from '../../domain/dtos/EpicAuthToken';
import { MOCK_EPIC_GAMES, MOCK_SEARCH_RESULTS, simulateDelay } from './MockDataProvider';

/**
 * Mock de IEpicGamesApiService.
 *
 * exchangeAuthCode: acepta cualquier código no vacío y devuelve un token mock.
 * fetchLibrary: devuelve MOCK_EPIC_GAMES (ignora el token).
 * parseExportedLibrary: ignora el contenido real y devuelve MOCK_EPIC_GAMES.
 * searchCatalog: filtra los resultados de búsqueda mock.
 */
@injectable()
export class MockEpicGamesApiService implements IEpicGamesApiService {

    async exchangeAuthCode(code: string): Promise<EpicAuthToken> {
        await simulateDelay(600);
        if (!code.trim()) {
            throw new Error('El código de autorización no puede estar vacío.');
        }
        // Simula un token válido durante 8 horas
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
        return new EpicAuthToken(
            'mock_access_token_epic_abc123',
            'mock_account_id_00000000',
            'MockPlayer',
            expiresAt,
        );
    }

    async fetchLibrary(_accessToken: string, _accountId: string): Promise<Game[]> {
        await simulateDelay(800);
        return [...MOCK_EPIC_GAMES];
    }

    async parseExportedLibrary(_fileContent: string): Promise<Game[]> {
        await simulateDelay(800);
        return [...MOCK_EPIC_GAMES];
    }

    async searchCatalog(query: string): Promise<SearchResult[]> {
        await simulateDelay(600);
        if (!query.trim()) return [];
        const lower = query.toLowerCase();
        return MOCK_SEARCH_RESULTS.filter(r =>
            r.getTitle().toLowerCase().includes(lower),
        );
    }
}
