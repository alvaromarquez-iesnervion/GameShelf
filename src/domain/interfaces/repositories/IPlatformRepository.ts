import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { Platform } from '../../enums/Platform';
import { GogAuthToken } from '../../dtos/GogAuthToken';
import { EpicAuthToken } from '../../dtos/EpicAuthToken';

/**
 * Métodos separados por plataforma porque cada una tiene un flujo diferente:
 *   Steam  → OpenID 2.0 → recibe SteamID, no hay token que guardar
 *   Epic   → auth code  → almacena access_token + refresh_token en SecureStore
 *            (flujo GDPR) → solo se almacena el flag "imported", sin token
 *   GOG    → OAuth2 → almacena access_token + refresh_token en SecureStore del dispositivo
 */
export interface IPlatformRepository {
    /** Almacena SteamID en Firestore (users/{id}/platforms/steam). */
    linkSteamPlatform(userId: string, steamId: string): Promise<LinkedPlatform>;
    /**
     * Marca Epic Games como vinculado.
     * @param epicAccountId  Account ID real de Epic cuando se usa el flujo de auth code.
     *                       Si se omite (flujo GDPR), se guarda el flag "imported".
     * @param token          Token OAuth2 del flujo de auth code. Si se proporciona,
     *                       se almacena en SecureStore para permitir renovación automática.
     */
    linkEpicPlatform(userId: string, epicAccountId?: string, token?: EpicAuthToken): Promise<LinkedPlatform>;
    /**
     * Almacena la vinculación de GOG con tokens OAuth2.
     * El gogUserId se guarda en Firestore; access_token y refresh_token
     * se guardan en SecureStore del dispositivo (Keychain/Keystore).
     */
    linkGogPlatform(userId: string, gogUserId: string, tokens: GogAuthToken): Promise<LinkedPlatform>;
    /** Elimina vinculación y juegos de esa plataforma de Firestore. */
    unlinkPlatform(userId: string, platform: Platform): Promise<void>;
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
}
