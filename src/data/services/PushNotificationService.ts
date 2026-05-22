import 'reflect-metadata';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { TYPES } from '../../di/types';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';

const PUSH_PERMS_KEY = '@gameshelf/push_permissions';
const PUSH_TOKEN_KEY = '@gameshelf/expo_push_token';

type PushPermissionState = 'granted' | 'denied' | 'undetermined';

function getPlatform(): 'ios' | 'android' | 'web' {
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'web';
}

/**
 * Manages Expo push notification token registration and permission state.
 *
 * Lifecycle: call initialize() once after login to request permissions and
 * register the token with the backend. Call unregisterAll() on logout so the
 * backend stops delivering notifications to this device.
 *
 * Permission state and token are persisted in AsyncStorage so the service
 * can reflect the last-known state synchronously on the next app launch,
 * before the OS prompt resolves.
 */
@injectable()
export class PushNotificationService {
    private _isInitialized: boolean = false;
    private _permissionState: PushPermissionState = 'undetermined';
    private _expoToken: string | null = null;

    constructor(
        @inject(TYPES.IGameShelfApiClient)
        private readonly apiClient: IGameShelfApiClient,
    ) {
        makeAutoObservable(this);
        this._loadLocalState();
    }

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    get permissionState(): PushPermissionState {
        return this._permissionState;
    }

    get hasToken(): boolean {
        return this._expoToken !== null && this._expoToken.length > 0;
    }

    /** Requests notification permissions and registers the Expo token with the backend. */
    async initialize(userId: string): Promise<void> {
        if (this._isInitialized) return;

        try {
            const status = await this._requestPermissions();
            runInAction(() => {
                this._permissionState = status;
            });

            if (status === 'granted') {
                const token = await this._getExpoToken();
                if (token) {
                    runInAction(() => {
                        this._expoToken = token;
                    });
                    try {
                        await this.apiClient.registerPushToken(token, getPlatform());
                    } catch (err) {
                        // Non-fatal: the user can still use the app; token will be retried on next login.
                        console.warn('[PushNotifications] Token registration failed:', err);
                    }
                }
            }

            runInAction(() => {
                this._isInitialized = true;
            });
        } catch (err) {
            console.warn('[PushNotifications] initialize() failed:', err);
        }
    }

    /** Removes all push tokens from the backend and clears local state. */
    async unregisterAll(): Promise<void> {
        try {
            await this.apiClient.unregisterAllPushTokens();
        } catch {
            // Non-fatal — cleanup continues
        }
        runInAction(() => {
            this._expoToken = null;
        });
        await AsyncStorage.multiRemove([PUSH_PERMS_KEY, PUSH_TOKEN_KEY]);
    }

    /** Re-registers the current token with the backend (e.g. after a session refresh). */
    async reRegisterToken(userId: string): Promise<void> {
        if (!this._expoToken) return;
        try {
            await this.apiClient.registerPushToken(this._expoToken, getPlatform());
        } catch {
            // Non-fatal
        }
    }

    private async _loadLocalState(): Promise<void> {
        try {
            const perms = await AsyncStorage.getItem(PUSH_PERMS_KEY);
            if (perms) {
                runInAction(() => {
                    this._permissionState = perms as PushPermissionState;
                });
            }
        } catch {
            // ignore
        }
    }

    private async _requestPermissions(): Promise<PushPermissionState> {
        try {
            const settings = await Notifications.getPermissionsAsync();
            let status: PushPermissionState;

            if (settings.granted) {
                status = 'granted';
            } else if (settings.canAskAgain) {
                const response = await Notifications.requestPermissionsAsync();
                status = response.granted ? 'granted' : 'denied';
            } else {
                status = 'denied';
            }

            runInAction(() => {
                this._permissionState = status;
            });

            await AsyncStorage.setItem(PUSH_PERMS_KEY, status);
            return status;
        } catch {
            return 'undetermined';
        }
    }

    private async _getExpoToken(): Promise<string | null> {
        try {
            // projectId is required by Expo SDK 50+; fall back to easConfig for older SDK builds.
            const projectId =
                Constants.expoConfig?.extra?.eas?.projectId ??
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (Constants as any).easConfig?.projectId;

            if (!projectId) {
                console.warn('[PushNotifications] No EAS projectId in app config — cannot get push token');
                return null;
            }

            const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
            if (token) {
                runInAction(() => {
                    this._expoToken = token;
                });
                await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
                return token;
            }
            return null;
        } catch (err) {
            console.warn('[PushNotifications] Failed to get Expo push token:', err);
            return null;
        }
    }

    /** Resets internal state to defaults. Intended for testing only. */
    reset(): void {
        runInAction(() => {
            this._isInitialized = false;
            this._permissionState = 'undetermined';
            this._expoToken = null;
        });
    }
}
