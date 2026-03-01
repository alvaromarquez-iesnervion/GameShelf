export interface IGuestSessionRepository {
    /** Crea y persiste un nuevo guest ID, o devuelve el existente si ya hay sesión. */
    getOrCreateGuestId(): Promise<string>;
    /** Devuelve el guest ID almacenado, o null si no hay sesión de invitado activa. */
    loadGuestId(): Promise<string | null>;
    /** Borra todos los datos locales del invitado (id, plataformas, biblioteca). */
    clearGuestSession(): Promise<void>;
}
