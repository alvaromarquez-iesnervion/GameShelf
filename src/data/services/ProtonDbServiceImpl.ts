import 'reflect-metadata';
import { injectable } from 'inversify';
import axios from 'axios';
import { IProtonDbService } from '../../domain/interfaces/services/IProtonDbService';
import { ProtonDbRating, ProtonTier } from '../../domain/entities/ProtonDbRating';
import { PROTONDB_API_URL, BROWSER_HEADERS } from '../config/ApiConstants';

// Estructura real de la respuesta de ProtonDB
interface ProtonDbResponse {
    tier: string;
    trendingTier: string;
    bestReportedTier: string;
    total: number;
    score: number;
    confidence: string;
}

/**
 * Valida que un string sea un ProtonTier válido.
 * Si no lo es, devuelve 'pending' como fallback.
 */
function toProtonTier(value: string | undefined | null): ProtonTier {
    const validTiers: ProtonTier[] = ['platinum', 'gold', 'silver', 'bronze', 'borked', 'pending'];
    if (value && validTiers.includes(value as ProtonTier)) {
        return value as ProtonTier;
    }
    return 'pending';
}

/**
 * Endpoint JSON no documentado de ProtonDB:
 *   GET https://www.protondb.com/api/v1/reports/summaries/{steamAppId}.json
 *
 * IMPORTANTE: Requiere headers User-Agent y Referer para no ser bloqueado
 * cuando se llama desde React Native (el User-Agent por defecto no es de navegador).
 *
 * Solo funciona con juegos de Steam (necesita steamAppId).
 * Devuelve null si el juego no está en ProtonDB o si el endpoint falla.
 */
@injectable()
export class ProtonDbServiceImpl implements IProtonDbService {

    async getCompatibilityRating(steamAppId: string): Promise<ProtonDbRating | null> {
        try {
            const response = await axios.get<ProtonDbResponse>(
                `${PROTONDB_API_URL}/${steamAppId}.json`,
                {
                    headers: {
                        ...BROWSER_HEADERS,
                        Referer: 'https://www.protondb.com',
                    },
                    timeout: 8000,
                },
            );
            const data = response.data;
            const tier = toProtonTier(data.tier);
            const trendingTier = toProtonTier(data.trendingTier ?? data.tier);
            return new ProtonDbRating(
                tier,
                trendingTier,
                data.total ?? 0,
            );
        } catch {
            // Endpoint no garantizado: 404 si el juego no está, o error de red/bloqueo
            return null;
        }
    }
}
