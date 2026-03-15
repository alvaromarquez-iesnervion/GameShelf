import AsyncStorage from '@react-native-async-storage/async-storage';

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
 * Preferencias locales del dispositivo (AsyncStorage).
 * Módulo-singleton — no requiere DI.
 */
export const UserPreferencesStore = {
    async getCountry(): Promise<string> {
        try {
            return (await AsyncStorage.getItem(COUNTRY_KEY)) ?? DEFAULT_COUNTRY;
        } catch {
            return DEFAULT_COUNTRY;
        }
    },

    async setCountry(code: string): Promise<void> {
        await AsyncStorage.setItem(COUNTRY_KEY, code);
    },

    getCountryOption(code: string): CountryOption {
        return SUPPORTED_COUNTRIES.find(c => c.code === code)
            ?? SUPPORTED_COUNTRIES[0];
    },
};
