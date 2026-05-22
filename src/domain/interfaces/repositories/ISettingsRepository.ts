export interface ISettingsRepository {
    /** Returns the country code stored in the backend, or null if no preference is set. */
    getCountry(): Promise<string | null>;
    /** Saves the country preference in the backend (e.g. "ES", "MX"). */
    setCountry(code: string): Promise<void>;
}
