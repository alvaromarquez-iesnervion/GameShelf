import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { Platform } from '../../enums/Platform';
import { GogAuthToken } from '../../dtos/GogAuthToken';
import { EpicAuthToken } from '../../dtos/EpicAuthToken';
import { PsnAuthToken } from '../../dtos/PsnAuthToken';

/**
 * Methods are split per platform because each has a different linking flow:
 *   Steam  → OpenID 2.0 → receives SteamID, no token to store
 *   Epic   → auth code  → stores access_token + refresh_token in SecureStore
 *            (GDPR flow) → only stores the "imported" flag, no token
 *   GOG    → OAuth2 → stores access_token + refresh_token in device SecureStore
 */
export interface IPlatformRepository {
    /** Stores the SteamID in Firestore (users/{id}/platforms/steam). */
    linkSteamPlatform(userId: string, steamId: string): Promise<LinkedPlatform>;
    /**
     * Marks Epic Games as linked.
     * @param epicAccountId  Real Epic account ID when using the auth code flow.
     *                       If omitted (GDPR flow), only the "imported" flag is saved.
     * @param token          OAuth2 token from the auth code flow. If provided,
     *                       stored in SecureStore to allow automatic token renewal.
     */
    linkEpicPlatform(userId: string, epicAccountId?: string, token?: EpicAuthToken): Promise<LinkedPlatform>;
    /**
     * Stores the GOG platform link with OAuth2 tokens.
     * The gogUserId is saved in Firestore; access_token and refresh_token
     * are saved in device SecureStore (Keychain/Keystore).
     */
    linkGogPlatform(userId: string, gogUserId: string, tokens: GogAuthToken): Promise<LinkedPlatform>;
    /**
     * Stores the PlayStation Network platform link.
     * The psnAccountId is saved in Firestore; access_token and refresh_token
     * are saved in device SecureStore (Keychain/Keystore).
     */
    linkPsnPlatform(userId: string, psnAccountId: string, tokens: PsnAuthToken): Promise<LinkedPlatform>;
    /** Removes the platform link and its games from Firestore. */
    unlinkPlatform(userId: string, platform: Platform): Promise<void>;
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
}
