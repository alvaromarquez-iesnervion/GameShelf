import 'reflect-metadata';
import { injectable } from 'inversify';
import axios from 'axios';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Deal } from '../../domain/entities/Deal';
import { SearchResult } from '../../domain/entities/SearchResult';
import { ITAD_API_BASE_URL, ITAD_API_KEY } from '../config/ApiConstants';

// Tipos de la API v2 de ITAD
interface ItadPriceEntry {
    shop: { id: string; name: string };
    price: { amount: number; amountInt: number; currency: string };
    regular: { amount: number; amountInt: number; currency: string };
    cut: number;         // % de descuento (0–100)
    url: string;
}

interface ItadSearchResult {
    id: string;          // UUID interno de ITAD
    slug: string;
    title: string;
    type: string;
    assets: { banner300?: string; banner400?: string; banner600?: string };
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
                { params: { ...this.authParams, title: query } },
            );
            const results: ItadSearchResult[] = response.data ?? [];
            return results.map(r => new SearchResult(
                r.id,
                r.title,
                r.assets?.banner300 ?? r.assets?.banner400 ?? '',
                false, // isInWishlist se cruza en SearchUseCase
            ));
        } catch {
            return [];
        }
    }

    // Mapper interno: ItadPriceEntry → Deal de dominio
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
