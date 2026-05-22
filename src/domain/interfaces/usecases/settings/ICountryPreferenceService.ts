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
    /** Country saved in the backend (null if no preference is set). */
    get savedCountry(): string | null;
    /** Country saved locally. */
    get localCountry(): string;
    /** Effective country: backend > local. */
    get effectiveCountry(): string;
    loadSavedPreference(): Promise<void>;
    getCountry(): Promise<string>;
    setCountry(code: string): Promise<void>;          // local + AsyncStorage only
    setCountryAndSync(code: string): Promise<void>;   // backend + local + AsyncStorage
    getCountryOption(code: string): CountryOption;
    reset(): void;
}
