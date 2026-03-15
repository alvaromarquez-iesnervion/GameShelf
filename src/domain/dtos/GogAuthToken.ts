/**
 * Token de autenticación obtenido al intercambiar un authorization code de GOG.
 */
export class GogAuthToken {
    constructor(
        /** Bearer token para llamadas autenticadas a la API de GOG. */
        public readonly accessToken: string,
        /** Token de refresco. Permite obtener un nuevo access token sin re-autenticar. */
        public readonly refreshToken: string,
        /** Fecha y hora de expiración del access token. */
        public readonly expiresAt: Date,
        /** User ID de la cuenta de GOG. */
        public readonly userId: string,
    ) {}

    /** True si el token ha expirado o expirará en los próximos 60 segundos. */
    isExpired(): boolean {
        return this.expiresAt.getTime() - Date.now() < 60_000;
    }
}
