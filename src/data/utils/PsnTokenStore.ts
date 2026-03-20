import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PsnAuthToken } from '../../domain/dtos/PsnAuthToken';

/**
 * Almacenamiento de tokens de PlayStation Network.
 *
 * - refresh_token y account_id → SecureStore (Keychain/Keystore, sensibles y pequeños)
 * - access_token y expires_at → AsyncStorage (pueden superar el límite de 2048 bytes de SecureStore)
 */

const SECURE_REFRESH_TOKEN = 'psn_refresh_token';
const SECURE_ACCOUNT_ID    = 'psn_account_id';
const ASYNC_ACCESS_TOKEN   = 'psn_access_token';
const ASYNC_EXPIRES_AT     = 'psn_expires_at';

export async function savePsnTokens(tokens: PsnAuthToken): Promise<void> {
    await Promise.all([
        AsyncStorage.setItem(ASYNC_ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(ASYNC_EXPIRES_AT, tokens.expiresAt.toISOString()),
        SecureStore.setItemAsync(SECURE_REFRESH_TOKEN, tokens.refreshToken),
        SecureStore.setItemAsync(SECURE_ACCOUNT_ID, tokens.accountId),
    ]);
}

export async function loadPsnTokens(): Promise<PsnAuthToken | null> {
    const [accessToken, expiresAtStr, refreshToken, accountId] = await Promise.all([
        AsyncStorage.getItem(ASYNC_ACCESS_TOKEN),
        AsyncStorage.getItem(ASYNC_EXPIRES_AT),
        SecureStore.getItemAsync(SECURE_REFRESH_TOKEN),
        SecureStore.getItemAsync(SECURE_ACCOUNT_ID),
    ]);

    if (!accessToken || !refreshToken || !expiresAtStr) return null;

    return new PsnAuthToken(accessToken, refreshToken, new Date(expiresAtStr), accountId ?? 'me');
}

export async function clearPsnTokens(): Promise<void> {
    await Promise.all([
        AsyncStorage.removeItem(ASYNC_ACCESS_TOKEN),
        AsyncStorage.removeItem(ASYNC_EXPIRES_AT),
        SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN),
        SecureStore.deleteItemAsync(SECURE_ACCOUNT_ID),
    ]);
}
