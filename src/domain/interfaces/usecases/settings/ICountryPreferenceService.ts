export interface CountryOption {
    code: string;
    label: string;
    currency: string;
}

export const DEFAULT_COUNTRY = 'US';

export const SUPPORTED_COUNTRIES: readonly CountryOption[] = [
    { code: 'US', label: 'Estados Unidos', currency: 'USD' },
    { code: 'ES', label: 'España',         currency: 'EUR' },
    { code: 'DE', label: 'Alemania',        currency: 'EUR' },
    { code: 'GB', label: 'Reino Unido',     currency: 'GBP' },
    { code: 'JP', label: 'Japón',           currency: 'JPY' },
    { code: 'AU', label: 'Australia',       currency: 'AUD' },
    { code: 'CA', label: 'Canadá',          currency: 'CAD' },
    { code: 'BR', label: 'Brasil',          currency: 'BRL' },
    { code: 'MX', label: 'México',          currency: 'MXN' },
] as const;

export interface ICountryPreferenceService {
    /** País guardado en backend (null si no hay preferencia). */
    get savedCountry(): string | null;
    /** País guardado localmente. */
    get localCountry(): string;
    /** País efectivo: backend > local. */
    get effectiveCountry(): string;
    loadSavedPreference(): Promise<void>;
    getCountry(): Promise<string>;
    setCountry(code: string): Promise<void>;          // solo local + AsyncStorage
    setCountryAndSync(code: string): Promise<void>;   // backend + local + AsyncStorage
    getCountryOption(code: string): CountryOption;
    reset(): void;
}
