import 'reflect-metadata';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { ISettingsRepository } from '../../domain/interfaces/repositories/ISettingsRepository';
import { TYPES } from '../../di/types';

const COUNTRY_KEY = '@gameshelf/preferred_country';

export const DEFAULT_COUNTRY = 'US';

export interface CountryOption {
    code: string;
    label: string;
    currency: string;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
    { code: 'US', label: 'Estados Unidos', currency: 'USD' },
    { code: 'ES', label: 'España',          currency: 'EUR' },
    { code: 'DE', label: 'Alemania',        currency: 'EUR' },
    { code: 'GB', label: 'Reino Unido',     currency: 'GBP' },
    { code: 'JP', label: 'Japón',           currency: 'JPY' },
    { code: 'AU', label: 'Australia',       currency: 'AUD' },
    { code: 'CA', label: 'Canadá',          currency: 'CAD' },
    { code: 'BR', label: 'Brasil',          currency: 'BRL' },
    { code: 'MX', label: 'México',          currency: 'MXN' },
];

/**
 * Store observable de preferencias del usuario.
 * Sincroniza la preferencia de país con AsyncStorage y el backend.
 */
@injectable()
export class UserPreferencesStore {
    private _savedCountry: string | null = null;
    private _localCountry: string = DEFAULT_COUNTRY;

    constructor(
        @inject(TYPES.ISettingsRepository) private readonly settingsRepo: ISettingsRepository,
    ) {
        makeAutoObservable(this);
        this.loadLocalPreference();
    }

    get savedCountry(): string | null {
        return this._savedCountry;
    }

    get localCountry(): string {
        return this._localCountry;
    }

    /** Devuelve el país efectivo: backend si existe, sino localStorage. */
    get effectiveCountry(): string {
        return this._savedCountry ?? this._localCountry;
    }

    private async loadLocalPreference(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(COUNTRY_KEY);
            runInAction(() => {
                this._localCountry = stored ?? DEFAULT_COUNTRY;
            });
        } catch {
            // ignore
        }
    }

    /** Carga la preferencia guardada en el backend y sincroniza. */
    async loadSavedPreference(): Promise<void> {
        try {
            const saved = await this.settingsRepo.getCountry();
            runInAction(() => {
                this._savedCountry = saved;
                if (saved) {
                    this._localCountry = saved;
                    AsyncStorage.setItem(COUNTRY_KEY, saved).catch(() => {});
                }
            });
        } catch {
            // Si falla la carga del backend, mantener local
        }
    }

    async getCountry(): Promise<string> {
        return this.effectiveCountry;
    }

    /** Guarda en localStorage sin sincronizar con backend (legacy). */
    async setCountry(code: string): Promise<void> {
        runInAction(() => {
            this._localCountry = code;
        });
        await AsyncStorage.setItem(COUNTRY_KEY, code);
    }

    /** Guarda en localStorage Y sincroniza con el backend. */
    async setCountryAndSync(code: string): Promise<void> {
        try {
            await this.settingsRepo.setCountry(code);
            runInAction(() => {
                this._savedCountry = code;
                this._localCountry = code;
            });
            await AsyncStorage.setItem(COUNTRY_KEY, code);
        } catch {
            // Fallback: guardar localmente aunque falle el backend
            runInAction(() => {
                this._localCountry = code;
            });
            await AsyncStorage.setItem(COUNTRY_KEY, code);
        }
    }

    getCountryOption(code: string): CountryOption {
        return SUPPORTED_COUNTRIES.find(c => c.code === code)
            ?? SUPPORTED_COUNTRIES[0];
    }
}
