import 'reflect-metadata';
import { injectable } from 'inversify';
import axios from 'axios';
import { TtlCache } from '../utils/ttlCache';
import { IHowLongToBeatService } from '../../domain/interfaces/services/IHowLongToBeatService';
import { HltbResult } from '../../domain/entities/HltbResult';
import { HLTB_INIT_URL, HLTB_SEARCH_URL } from '../config/ApiConstants';

const RESULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Estructura relevante de un resultado de HLTB
interface HltbGameEntry {
    game_name: string;
    comp_main: number;   // segundos de historia principal
    comp_plus: number;   // segundos historia + extras
    comp_100: number;    // segundos completista (100%)
}

/**
 * NO usar la librería npm "howlongtobeat" — depende de módulos Node.js
 * (events, stream, buffer) incompatibles con el runtime de React Native.
 *
 * Flujo actual de la API de HLTB (actualizado — la URL anterior /api/search da 404):
 *
 *   1. GET /api/finder/init?t={timestamp}
 *      → Devuelve { token: string } — token de sesión necesario para buscar.
 *
 *   2. POST /api/finder
 *      Headers: Content-Type: application/json, x-auth-token: {token}
 *      Body: { searchType, searchTerms, searchPage, size, searchOptions, useCache }
 *      → Devuelve { data: HltbGameEntry[] }
 *
 * Si el token expira (respuesta 403), se renueva automáticamente y se reintenta.
 * Los campos comp_main/comp_plus/comp_100 vienen en segundos → dividir entre 3600.
 *
 * AVISO: La API es interna (no documentada) y puede cambiar sin previo aviso.
 */
// TTL del token de sesión de HLTB (30 minutos — conservador para evitar 403 en sesiones largas)
const HLTB_TOKEN_TTL_MS = 30 * 60 * 1000;

@injectable()
export class HowLongToBeatServiceImpl implements IHowLongToBeatService {

    private readonly resultCache = new TtlCache<string, HltbResult | null>();

    private readonly browserHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://howlongtobeat.com',
        'Origin': 'https://howlongtobeat.com',
    };

    private _cachedToken: string | null = null;
    private _tokenExpiresAt: number = 0;

    async getGameDuration(gameTitle: string): Promise<HltbResult | null> {
        const cached = this.resultCache.get(gameTitle);
        if (cached !== undefined) return cached;

        let result: HltbResult | null;
        try {
            const token = await this.fetchToken();
            if (!token) return null;
            result = await this.search(gameTitle, token);
        } catch (err: unknown) {
            // Si el token expiró (403), invalidar caché, refrescar y reintentar una vez
            const status = (err as { response?: { status?: number } }).response?.status;
            if (status === 403) {
                this._cachedToken = null;
                try {
                    const freshToken = await this.fetchToken();
                    if (!freshToken) return null;
                    result = await this.search(gameTitle, freshToken);
                } catch {
                    return null;
                }
            } else {
                return null;
            }
        }

        this.resultCache.set(gameTitle, result, RESULT_TTL_MS);
        return result;
    }

    private async fetchToken(): Promise<string | null> {
        if (this._cachedToken && Date.now() < this._tokenExpiresAt) {
            return this._cachedToken;
        }
        try {
            const response = await axios.get(
                `${HLTB_INIT_URL}?t=${Date.now()}`,
                {
                    headers: this.browserHeaders,
                    timeout: 8000,
                },
            );
            const token: string | null = response.data?.token ?? null;
            if (token) {
                this._cachedToken = token;
                this._tokenExpiresAt = Date.now() + HLTB_TOKEN_TTL_MS;
            }
            return token;
        } catch {
            return null;
        }
    }

    private async search(gameTitle: string, token: string): Promise<HltbResult | null> {
        const body = {
            searchType: 'games',
            searchTerms: gameTitle.trim().split(' '),
            searchPage: 1,
            size: 5,
            searchOptions: {
                games: {
                    userId: 0,
                    platform: '',
                    sortCategory: 'popular',
                    rangeCategory: 'main',
                    rangeTime: { min: null, max: null },
                    gameplay: { perspective: '', flow: '', genre: '', difficulty: '' },
                    rangeYear: { min: '', max: '' },
                    modifier: '',
                },
                users: { sortCategory: 'postcount' },
                lists: { sortCategory: 'follows' },
                filter: '',
                sort: 0,
                randomizer: 0,
            },
            useCache: true,
        };

        const response = await axios.post(
            HLTB_SEARCH_URL,
            body,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                    ...this.browserHeaders,
                },
                timeout: 8000,
            },
        );

        const results: HltbGameEntry[] = response.data?.data ?? [];
        if (results.length === 0) return null;

        const best = results[0];

        const toHours = (seconds: number): number | null =>
            seconds > 0 ? Math.round((seconds / 3600) * 10) / 10 : null;

        return new HltbResult(
            toHours(best.comp_main),
            toHours(best.comp_plus),
            toHours(best.comp_100),
        );
    }
}
