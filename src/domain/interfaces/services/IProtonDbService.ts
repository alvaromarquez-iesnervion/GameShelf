import { ProtonDbRating } from '../../entities/ProtonDbRating';

/**
 * API no oficial: GET https://www.protondb.com/api/v1/reports/summaries/{steamAppId}.json
 * Requiere headers User-Agent y Referer para no ser bloqueado desde React Native.
 * Solo funciona con juegos de Steam (no Epic). Puede dejar de funcionar sin aviso.
 */
export interface IProtonDbService {
    /** Devuelve null si falla (endpoint no garantizado) o el juego no está en ProtonDB. */
    getCompatibilityRating(steamAppId: string): Promise<ProtonDbRating | null>;
}
