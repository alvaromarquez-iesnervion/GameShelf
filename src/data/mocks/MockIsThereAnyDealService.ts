import 'reflect-metadata';
import { injectable } from 'inversify';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Deal } from '../../domain/entities/Deal';
import { SearchResult } from '../../domain/entities/SearchResult';
import {
    MOCK_DEALS_BY_ITAD_ID,
    MOCK_DEALS_BY_STEAM_APP_ID,
    MOCK_SEARCH_RESULTS,
    simulateDelay,
} from './MockDataProvider';

// Mapa de título normalizado → itadGameId (simula el lookup de ITAD)
const TITLE_TO_ITAD_ID: Record<string, string> = {
    'elden ring':         'itad-elden-ring-uuid',
    'cyberpunk 2077':     'itad-cyberpunk-uuid',
    'hades':              'itad-hades-uuid',
    "baldur's gate 3":    'itad-bg3-uuid',
    'hollow knight':      'itad-hollow-knight-uuid',
    'stardew valley':     'itad-stardew-uuid',
};

// Mapa de steamAppId (string) → itadGameId
const STEAM_APP_TO_ITAD_ID: Record<string, string> = {
    '1245620': 'itad-elden-ring-uuid',
    '1091500': 'itad-cyberpunk-uuid',
    '1145360': 'itad-hades-uuid',
    '1086940': 'itad-bg3-uuid',
    '367520':  'itad-hollow-knight-uuid',
    '413150':  'itad-stardew-uuid',
};

/**
 * Mock de IIsThereAnyDealService.
 *
 * Simula el flujo completo de la API v2 oficial de ITAD:
 *   1. lookupGameId / lookupGameIdBySteamAppId → UUID
 *   2. getPricesForGame → lista de Deal con tiendas y precios
 *   3. getHistoricalLow → el deal de menor precio histórico
 *   4. searchGames → resultados del catálogo ITAD
 */
@injectable()
export class MockIsThereAnyDealService implements IIsThereAnyDealService {

    async lookupGameId(title: string): Promise<string | null> {
        await simulateDelay(350);
        const key = title.toLowerCase().trim();
        // Búsqueda exacta
        if (TITLE_TO_ITAD_ID[key]) return TITLE_TO_ITAD_ID[key];
        // Búsqueda parcial
        const match = Object.keys(TITLE_TO_ITAD_ID).find(k =>
            key.includes(k) || k.includes(key),
        );
        return match ? TITLE_TO_ITAD_ID[match] : null;
    }

    async lookupGameIdBySteamAppId(steamAppId: string): Promise<string | null> {
        await simulateDelay(300);
        return STEAM_APP_TO_ITAD_ID[steamAppId] ?? null;
    }

    async getPricesForGame(itadGameId: string): Promise<Deal[]> {
        await simulateDelay(500);
        return [...(MOCK_DEALS_BY_ITAD_ID[itadGameId] ?? [])];
    }

    async getHistoricalLow(itadGameId: string): Promise<Deal | null> {
        await simulateDelay(400);
        const deals = MOCK_DEALS_BY_ITAD_ID[itadGameId] ?? [];
        if (deals.length === 0) return null;
        // El histórico más bajo es el de mayor descuento
        return deals.reduce((best, d) =>
            d.getDiscountPercentage() > best.getDiscountPercentage() ? d : best,
        );
    }

    async searchGames(query: string): Promise<SearchResult[]> {
        await simulateDelay(600);
        if (!query.trim()) return [];
        const lower = query.toLowerCase();
        return MOCK_SEARCH_RESULTS.filter(r =>
            r.getTitle().toLowerCase().includes(lower),
        );
    }
}
