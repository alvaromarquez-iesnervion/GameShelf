/**
 * Token de autenticación obtenido al intercambiar un authorization code de Epic Games.
 *
 * AVISO: este flujo usa la API interna (no documentada) de Epic Games.
 * Puede dejar de funcionar sin previo aviso si Epic cambia sus endpoints.
 */
export class EpicAuthToken {
    constructor(
        /** Bearer token para llamadas autenticadas a la API de Epic. */
        public readonly accessToken: string,
        /** Account ID de Epic (string con formato UUID). */
        public readonly accountId: string,
        /** Display name de la cuenta de Epic (p.ej. "NombreJugador"). */
        public readonly displayName: string,
        /** Fecha y hora de expiración del access token. */
        public readonly expiresAt: Date,
        /** Token de refresco. Permite obtener un nuevo access token sin re-autenticar. */
        public readonly refreshToken: string = '',
    ) {}

    /** True si el token ha expirado o expirará en los próximos 60 segundos. */
    isExpired(): boolean {
        return this.expiresAt.getTime() - Date.now() < 60_000;
    }
}
