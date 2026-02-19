import 'reflect-metadata';
import { injectable } from 'inversify';
import axios from 'axios';
import { IIsThereAnyDealService, ItadGameInfo } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Deal } from '../../domain/entities/Deal';
import { SearchResult } from '../../domain/entities/SearchResult';
import { ITAD_API_BASE_URL, ITAD_API_KEY } from '../config/ApiConstants';

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
@injectable()
export class IsThereAnyDealServiceImpl implements IIsThereAnyDealService {

    private get authParams() {
        return { key: ITAD_API_KEY };
    }

    async lookupGameId(title: string): Promise<string | null> {
        try {
            const response = await axios.post(
                `${ITAD_API_BASE_URL}/games/lookup/v1`,
                [title],
                { params: this.authParams },
            );
            return response.data?.[0]?.id ?? null;
        } catch {
            return null;
        }
    }

    async lookupGameIdBySteamAppId(steamAppId: string): Promise<string | null> {
        try {
            const response = await axios.post(
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
            const response = await axios.post(
                `${ITAD_API_BASE_URL}/games/prices/v2`,
                [itadGameId],
                { params: this.authParams },
            );
            const priceData = response.data?.[0]?.deals ?? [];
            return priceData.map((p: ItadPriceEntry, i: number) =>
                this.mapItadPriceToDeal(p, i),
            );
        } catch {
            return [];
        }
    }

    async getHistoricalLow(itadGameId: string): Promise<Deal | null> {
        try {
            const response = await axios.post(
                `${ITAD_API_BASE_URL}/games/historylow/v1`,
                [itadGameId],
                { params: this.authParams },
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
            );
        } catch {
            return null;
        }
    }

    async searchGames(query: string): Promise<SearchResult[]> {
        try {
            const response = await axios.get(
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

            const infoPromises = searchResults.map(async (r) => {
                try {
                    const info = await this.getGameInfo(r.getId());
                    if (info?.steamAppId) {
                        r.setSteamAppId(info.steamAppId);
                    }
                } catch {}
            });
            await Promise.allSettled(infoPromises);
            
            return searchResults;
        } catch {
            return [];
        }
    }

    async getGameInfo(itadGameId: string): Promise<ItadGameInfo | null> {
        try {
            const response = await axios.get(
                `${ITAD_API_BASE_URL}/games/info/v2`,
                { params: { ...this.authParams, id: itadGameId } },
            );
            const data: ItadGameInfoResponse = response.data;
            
            return {
                id: data.id,
                title: data.title,
                steamAppId: data.appid ?? null,
                coverUrl: data.assets?.banner300 ?? data.assets?.banner400 ?? '',
            };
        } catch {
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
        );
    }
}
