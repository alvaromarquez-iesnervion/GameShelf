import 'reflect-metadata';
import { injectable } from 'inversify';
import { IEpicGamesApiService } from '../../domain/interfaces/services/IEpicGamesApiService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { MOCK_EPIC_GAMES, MOCK_SEARCH_RESULTS, simulateDelay } from './MockDataProvider';

/**
 * Mock de IEpicGamesApiService.
 *
 * parseExportedLibrary: ignora el contenido real y devuelve MOCK_EPIC_GAMES.
 * searchCatalog: filtra los resultados de búsqueda mock.
 *
 * Útil para testear el flujo de importación de Epic sin necesitar
 * el archivo JSON real del export GDPR.
 */
@injectable()
export class MockEpicGamesApiService implements IEpicGamesApiService {

    async parseExportedLibrary(_fileContent: string): Promise<Game[]> {
        await simulateDelay(800); // simula el parseo del archivo
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
