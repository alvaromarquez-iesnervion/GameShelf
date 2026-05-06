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

/** Estado de permisos de notificacion almacenado localmente. */
type PushPermissionState = 'granted' | 'denied' | 'undetermined';

/** Plataforma detectada para el token push. */
function getPlatform(): 'ios' | 'android' | 'web' {
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'web';
}

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

    /** Solicita permisos de notificacion y registra el token con el backend. */
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

    /** Remueve todos los tokens push del backend y limpia estado local. */
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

    /** Re-registra el token actual con el backend (util despues de un refresh). */
    async reRegisterToken(userId: string): Promise<void> {
        if (!this._expoToken) return;
        try {
            await this.apiClient.registerPushToken(this._expoToken, getPlatform());
        } catch {
            // Non-fatal
        }
    }

    /** Carga el estado local almacenado en AsyncStorage. */
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

    /** Solicita permisos de notificacion al sistema. */
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

    /** Obtiene el token Expo Push (solicita permisos si es necesario). */
    private async _getExpoToken(): Promise<string | null> {
        try {
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

    /** Restablece el estado a valores por defecto (para testing). */
    reset(): void {
        runInAction(() => {
            this._isInitialized = false;
            this._permissionState = 'undetermined';
            this._expoToken = null;
        });
    }
}
