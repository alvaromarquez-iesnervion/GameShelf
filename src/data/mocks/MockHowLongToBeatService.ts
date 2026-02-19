import 'reflect-metadata';
import { injectable } from 'inversify';
import { IHowLongToBeatService } from '../../domain/interfaces/services/IHowLongToBeatService';
import { HltbResult } from '../../domain/entities/HltbResult';
import { MOCK_HLTB_DATA, simulateDelay } from './MockDataProvider';

/**
 * Mock de IHowLongToBeatService.
 *
 * Busca por título normalizado (toLowerCase + trim).
 * Simula el comportamiento del POST a howlongtobeat.com/api/search:
 *   - Título reconocido → HltbResult con horas decimales
 *   - Título no reconocido → null (como cuando HLTB no tiene datos del juego)
 *
 * La búsqueda es flexible: basta con que el título del juego
 * contenga la clave del mapa (o viceversa).
 */
@injectable()
export class MockHowLongToBeatService implements IHowLongToBeatService {

    async getGameDuration(gameTitle: string): Promise<HltbResult | null> {
        await simulateDelay(450);
        const normalized = gameTitle.toLowerCase().trim();

        // Búsqueda exacta primero
        if (MOCK_HLTB_DATA[normalized]) {
            return MOCK_HLTB_DATA[normalized];
        }

        // Búsqueda parcial (el título contiene la clave o viceversa)
        const matchKey = Object.keys(MOCK_HLTB_DATA).find(
            key => normalized.includes(key) || key.includes(normalized),
        );
        return matchKey ? MOCK_HLTB_DATA[matchKey] : null;
    }
}
