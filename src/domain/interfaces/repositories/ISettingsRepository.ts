export interface ISettingsRepository {
    /** Obtiene el código de país guardado en el backend, o null si no hay preferencia. */
    getCountry(): Promise<string | null>;
    /** Guarda la preferencia de país en el backend (ej: "ES", "MX"). */
    setCountry(code: string): Promise<void>;
}
