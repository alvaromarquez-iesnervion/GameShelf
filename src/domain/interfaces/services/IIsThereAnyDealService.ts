import { Deal } from '../../entities/Deal';
import { SearchResult } from '../../entities/SearchResult';

export interface ItadGameInfo {
    id: string;
    title: string;
    steamAppId: number | null;
    coverUrl: string;
}

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
    /** GET /games/info/v2?id={itadGameId} → info detallada incluyendo steam appid. */
    getGameInfo(itadGameId: string): Promise<ItadGameInfo | null>;
}
