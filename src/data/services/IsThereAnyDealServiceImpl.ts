import 'reflect-metadata';
import { injectable } from 'inversify';
import axios from 'axios';
import { UserPreferencesStore } from '../utils/UserPreferencesStore';
import { addAxiosRetryInterceptor } from '../utils/httpRetry';
import { TtlCache } from '../utils/ttlCache';
import { IIsThereAnyDealService, ItadGameInfo } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Deal } from '../../domain/entities/Deal';
import { SearchResult } from '../../domain/entities/SearchResult';
import { ITAD_API_BASE_URL, ITAD_API_KEY } from '../config/ApiConstants';

const itadAxios = axios.create({ timeout: 8_000 });
addAxiosRetryInterceptor(itadAxios);

interface ItadPriceEntry {
    shop: { id: string; name: string };
    price: { amount: number; amountInt: number; currency: string };
    regular: { amount: number; amountInt: number; currency: string };
    cut: number;
    url: string;
}

interface ItadSearchResult {
    id: string;
    slug: string;
    title: string;
    type: string;
    assets: { banner300?: string; banner400?: string; banner600?: string };
}

interface ItadGameInfoResponse {
    id: string;
    title: string;
    appid?: number;
    assets?: { banner300?: string; banner400?: string; banner600?: string };
}

/**
 * API v2 oficial de IsThereAnyDeal.
 * Base URL: https://api.isthereanydeal.com
 * Auth: API Key pasada como query param (?key={ITAD_API_KEY})
 *
 * Flujo recomendado para obtener ofertas:
 *   1. lookupGameIdBySteamAppId() si el juego tiene steamAppId (más fiable)
 *   2. lookupGameId() por título como fallback
 *   3. getPricesForGame() con el UUID obtenido
 *
 * Términos: no modificar datos, mencionar/enlazar IsThereAnyDeal.
 */
const GAME_INFO_TTL_MS = 15 * 60 * 1000; // 15 minutes

@injectable()
export class IsThereAnyDealServiceImpl implements IIsThereAnyDealService {

    private readonly gameInfoCache = new TtlCache<string, ItadGameInfo | null>();

    private get authParams() {
        return { key: ITAD_API_KEY };
    }

    async lookupGameId(title: string): Promise<string | null> {
        try {
            const response = await itadAxios.post(
                `${ITAD_API_BASE_URL}/games/lookup/v1`,
                [title],
                { params: this.authParams },
            );
            return response.data?.[0]?.id ?? null;
        } catch {
            return null;
        }
    }

    async lookupGameIdsBatch(titles: string[]): Promise<Map<string, string | null>> {
        const resultMap = new Map<string, string | null>();
        
        if (titles.length === 0) return resultMap;

        try {
            const response = await itadAxios.post(
                `${ITAD_API_BASE_URL}/games/lookup/v1`,
                titles,
                { params: this.authParams },
            );
            
            // Response es un array en el mismo orden que el input
            const results = response.data ?? [];
            titles.forEach((title, index) => {
                const itadId = results[index]?.id ?? null;
                resultMap.set(title, itadId);
            });
        } catch {
            // En caso de error, marcar todos como null
            titles.forEach(title => resultMap.set(title, null));
        }

        return resultMap;
    }

    async lookupGameIdBySteamAppId(steamAppId: string): Promise<string | null> {
        try {
            const response = await itadAxios.post(
                `${ITAD_API_BASE_URL}/games/lookup/id/shop/v1`,
                { shop: 'steam', ids: [`app/${steamAppId}`] },
                { params: this.authParams },
            );
            // Respuesta: { "app/730": "uuid..." }
            const result = response.data?.[`app/${steamAppId}`];
            return result ?? null;
        } catch {
            return null;
        }
    }

    async getPricesForGame(itadGameId: string): Promise<Deal[]> {
        try {
            const country = await UserPreferencesStore.getCountry();
            const response = await itadAxios.post(
                `${ITAD_API_BASE_URL}/games/prices/v2`,
                [itadGameId],
                { params: { ...this.authParams, country } },
            );
            const priceData = response.data?.[0]?.deals ?? [];
            return priceData.map((p: ItadPriceEntry, i: number) =>
                this.mapItadPriceToDeal(p, i),
            );
        } catch {
            return [];
        }
    }

    async getPricesForGamesBatch(itadGameIds: string[]): Promise<Map<string, Deal[]>> {
        const resultMap = new Map<string, Deal[]>();

        if (itadGameIds.length === 0) return resultMap;

        try {
            const country = await UserPreferencesStore.getCountry();
            const response = await itadAxios.post(
                `${ITAD_API_BASE_URL}/games/prices/v2`,
                itadGameIds,
                { params: { ...this.authParams, country } },
            );
            
            // Response es un array en el mismo orden que el input
            const results = response.data ?? [];
            itadGameIds.forEach((gameId, index) => {
                const priceData = results[index]?.deals ?? [];
                const deals = priceData.map((p: ItadPriceEntry, i: number) =>
                    this.mapItadPriceToDeal(p, i),
                );
                resultMap.set(gameId, deals);
            });
        } catch {
            // En caso de error, marcar todos como array vacío
            itadGameIds.forEach(gameId => resultMap.set(gameId, []));
        }

        return resultMap;
    }

    async getHistoricalLow(itadGameId: string): Promise<Deal | null> {
        try {
            const country = await UserPreferencesStore.getCountry();
            const response = await itadAxios.post(
                `${ITAD_API_BASE_URL}/games/historylow/v1`,
                [itadGameId],
                { params: { ...this.authParams, country } },
            );
            const low = response.data?.[0];
            if (!low) return null;
            return new Deal(
                `histlow_${itadGameId}`,
                low.shop?.name ?? 'Desconocido',
                low.price?.amount ?? 0,
                low.regular?.amount ?? 0,
                low.cut ?? 0,
                low.url ?? '',
                low.price?.currency ?? 'USD',
            );
        } catch {
            return null;
        }
    }

    async searchGames(query: string): Promise<SearchResult[]> {
        try {
            const response = await itadAxios.get(
                `${ITAD_API_BASE_URL}/games/search/v1`,
                { params: { ...this.authParams, title: query, limit: 20 } },
            );
            const results: ItadSearchResult[] = response.data ?? [];

            const searchResults = results.map(r => new SearchResult(
                r.id,
                r.title,
                r.assets?.banner300 ?? r.assets?.banner400 ?? '',
                false,
                null,
            ));

            // N-12: enriquecer solo los primeros 5 resultados con steamAppId.
            // Los usuarios raramente interactúan con resultados más allá del 5.°
            // y la API ITAD no soporta batch para /games/info/v2.
            const TOP_N_TO_ENRICH = 5;
            const toEnrich = searchResults.slice(0, TOP_N_TO_ENRICH);
            const rest = searchResults.slice(TOP_N_TO_ENRICH);

            const enriched = await Promise.all(
                toEnrich.map(async (r) => {
                    try {
                        const info = await this.getGameInfo(r.getId());
                        if (info?.steamAppId) return r.withSteamAppId(info.steamAppId);
                    } catch {}
                    return r;
                }),
            );

            return [...enriched, ...rest];
        } catch {
            return [];
        }
    }

    async getGameInfo(itadGameId: string): Promise<ItadGameInfo | null> {
        const cached = this.gameInfoCache.get(itadGameId);
        if (cached !== undefined) return cached;

        try {
            const response = await itadAxios.get(
                `${ITAD_API_BASE_URL}/games/info/v2`,
                { params: { ...this.authParams, id: itadGameId } },
            );
            const data: ItadGameInfoResponse = response.data;

            const result: ItadGameInfo = {
                id: data.id,
                title: data.title,
                steamAppId: data.appid ?? null,
                coverUrl: data.assets?.banner300 ?? data.assets?.banner400 ?? '',
            };
            this.gameInfoCache.set(itadGameId, result, GAME_INFO_TTL_MS);
            return result;
        } catch {
            this.gameInfoCache.set(itadGameId, null, GAME_INFO_TTL_MS);
            return null;
        }
    }

    private mapItadPriceToDeal(entry: ItadPriceEntry, index: number): Deal {
        return new Deal(
            `${entry.shop.id}_${index}`,
            entry.shop.name,
            entry.price.amount,
            entry.regular.amount,
            entry.cut,
            entry.url,
            entry.price.currency,
        );
    }
}
