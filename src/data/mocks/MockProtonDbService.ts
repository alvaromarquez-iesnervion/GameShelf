import 'reflect-metadata';
import { injectable } from 'inversify';
import { IProtonDbService } from '../../domain/interfaces/services/IProtonDbService';
import { ProtonDbRating } from '../../domain/entities/ProtonDbRating';
import { MOCK_PROTONDB_RATINGS, simulateDelay } from './MockDataProvider';

/**
 * Mock de IProtonDbService.
 *
 * Devuelve ratings predefinidos según el steamAppId.
 * Simula el comportamiento del endpoint no oficial de ProtonDB:
 *   - Juegos de Epic (sin steamAppId) → null
 *   - steamAppId no reconocido → null
 *   - steamAppId conocido → ProtonDbRating con tier y trendingTier
 */
@injectable()
export class MockProtonDbService implements IProtonDbService {

    async getCompatibilityRating(steamAppId: string): Promise<ProtonDbRating | null> {
        await simulateDelay(400);
        return MOCK_PROTONDB_RATINGS[steamAppId] ?? null;
    }
}
