import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { Platform } from '../../enums/Platform';

/**
 * Métodos separados por plataforma porque cada una tiene un flujo diferente:
 *   Steam  → OpenID 2.0 → recibe SteamID, no hay token que guardar
 *   Epic   → importación manual → solo se almacena un flag "imported"
 */
export interface IPlatformRepository {
    /** Almacena SteamID en Firestore (users/{id}/platforms/steam). */
    linkSteamPlatform(userId: string, steamId: string): Promise<LinkedPlatform>;
    /** Marca la importación de Epic como completada. */
    linkEpicPlatform(userId: string): Promise<LinkedPlatform>;
    /** Elimina vinculación y juegos de esa plataforma de Firestore. */
    unlinkPlatform(userId: string, platform: Platform): Promise<void>;
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
}
