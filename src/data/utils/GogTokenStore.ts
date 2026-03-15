import * as SecureStore from 'expo-secure-store';
import { GogAuthToken } from '../../domain/dtos/GogAuthToken';

/**
 * Almacenamiento seguro de tokens OAuth de GOG.
 *
 * Usa expo-secure-store (Keychain en iOS, Keystore en Android) en lugar de
 * Firestore para que los tokens nunca viajen ni reposen en un servidor externo.
 * Los tokens son credenciales de sesión del dispositivo, no datos de usuario sincronizables.
 */

const KEY_ACCESS_TOKEN  = 'gog_access_token';
const KEY_REFRESH_TOKEN = 'gog_refresh_token';
const KEY_EXPIRES_AT    = 'gog_expires_at';
const KEY_USER_ID       = 'gog_user_id';

export async function saveGogTokens(tokens: GogAuthToken): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(KEY_ACCESS_TOKEN,  tokens.accessToken),
        SecureStore.setItemAsync(KEY_REFRESH_TOKEN, tokens.refreshToken),
        SecureStore.setItemAsync(KEY_EXPIRES_AT,    tokens.expiresAt.toISOString()),
        SecureStore.setItemAsync(KEY_USER_ID,       tokens.userId),
    ]);
}

export async function loadGogTokens(): Promise<GogAuthToken | null> {
    const [accessToken, refreshToken, expiresAtStr, userId] = await Promise.all([
        SecureStore.getItemAsync(KEY_ACCESS_TOKEN),
        SecureStore.getItemAsync(KEY_REFRESH_TOKEN),
        SecureStore.getItemAsync(KEY_EXPIRES_AT),
        SecureStore.getItemAsync(KEY_USER_ID),
    ]);

    if (!accessToken || !refreshToken || !expiresAtStr) return null;

    return new GogAuthToken(accessToken, refreshToken, new Date(expiresAtStr), userId ?? '');
}

export async function clearGogTokens(): Promise<void> {
    await Promise.all([
        SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN),
        SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN),
        SecureStore.deleteItemAsync(KEY_EXPIRES_AT),
        SecureStore.deleteItemAsync(KEY_USER_ID),
    ]);
}
