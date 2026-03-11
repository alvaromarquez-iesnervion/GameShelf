import * as SecureStore from 'expo-secure-store';
import { EpicAuthToken } from '../../domain/dtos/EpicAuthToken';

/**
 * Almacenamiento seguro de tokens OAuth de Epic Games.
 *
 * Usa expo-secure-store (Keychain en iOS, Keystore en Android).
 * Los tokens nunca se guardan en Firestore ni viajan a servidores externos.
 */

const KEY_ACCESS_TOKEN  = 'epic_access_token';
const KEY_REFRESH_TOKEN = 'epic_refresh_token';
const KEY_EXPIRES_AT    = 'epic_expires_at';
const KEY_ACCOUNT_ID    = 'epic_account_id';
const KEY_DISPLAY_NAME  = 'epic_display_name';

export async function saveEpicTokens(token: EpicAuthToken): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(KEY_ACCESS_TOKEN,  token.accessToken),
        SecureStore.setItemAsync(KEY_REFRESH_TOKEN, token.refreshToken),
        SecureStore.setItemAsync(KEY_EXPIRES_AT,    token.expiresAt.toISOString()),
        SecureStore.setItemAsync(KEY_ACCOUNT_ID,    token.accountId),
        SecureStore.setItemAsync(KEY_DISPLAY_NAME,  token.displayName),
    ]);
}

export async function loadEpicTokens(): Promise<EpicAuthToken | null> {
    const [accessToken, refreshToken, expiresAtStr, accountId, displayName] = await Promise.all([
        SecureStore.getItemAsync(KEY_ACCESS_TOKEN),
        SecureStore.getItemAsync(KEY_REFRESH_TOKEN),
        SecureStore.getItemAsync(KEY_EXPIRES_AT),
        SecureStore.getItemAsync(KEY_ACCOUNT_ID),
        SecureStore.getItemAsync(KEY_DISPLAY_NAME),
    ]);

    if (!accessToken || !refreshToken || !expiresAtStr) return null;

    return new EpicAuthToken(
        accessToken,
        accountId ?? '',
        displayName ?? '',
        new Date(expiresAtStr),
        refreshToken,
    );
}

export async function clearEpicTokens(): Promise<void> {
    await Promise.all([
        SecureStore.deleteItemAsync(KEY_ACCESS_TOKEN),
        SecureStore.deleteItemAsync(KEY_REFRESH_TOKEN),
        SecureStore.deleteItemAsync(KEY_EXPIRES_AT),
        SecureStore.deleteItemAsync(KEY_ACCOUNT_ID),
        SecureStore.deleteItemAsync(KEY_DISPLAY_NAME),
    ]);
}
