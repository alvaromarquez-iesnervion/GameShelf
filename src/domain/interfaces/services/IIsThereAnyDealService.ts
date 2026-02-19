import { Deal } from '../../entities/Deal';
import { SearchResult } from '../../entities/SearchResult';

/**
 * API v2 oficial: https://api.isthereanydeal.com
 * Requiere API Key registrada en isthereanydeal.com/apps/my/
 * Términos: no modificar datos, mencionar/enlazar IsThereAnyDeal.
 *
 * Flujo para ofertas de un juego:
 *   1. lookupGameIdBySteamAppId (si steamAppId disponible) o lookupGameId (por título)
 *   2. getPricesForGame con el UUID obtenido
 */
export interface IIsThereAnyDealService {
    /** POST /games/lookup/v1 → UUID interno de ITAD. null si no encontrado. */
    lookupGameId(title: string): Promise<string | null>;
    /** POST /games/lookup/id/shop/v1 con shop="steam". Más fiable que por título. */
    lookupGameIdBySteamAppId(steamAppId: string): Promise<string | null>;
    /** POST /games/prices/v2 → lista de ofertas activas por tienda. */
    getPricesForGame(itadGameId: string): Promise<Deal[]>;
    /** POST /games/historylow/v1 → precio más bajo histórico. */
    getHistoricalLow(itadGameId: string): Promise<Deal | null>;
    /** GET /games/search/v1?title={query} → búsqueda en catálogo ITAD. */
    searchGames(query: string): Promise<SearchResult[]>;
}
