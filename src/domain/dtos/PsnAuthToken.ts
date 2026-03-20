/**
 * Token de autenticación obtenido al intercambiar un NPSSO token de PlayStation Network.
 *
 * AVISO: PSN no tiene API pública para terceros. Este flujo usa endpoints internos
 * reverse-engineered (usados por la app oficial de PlayStation y la web).
 * Puede dejar de funcionar sin previo aviso si Sony cambia sus endpoints.
 */
export class PsnAuthToken {
    constructor(
        /** Bearer token para llamadas autenticadas a la API de PSN. Dura pocas horas. */
        public readonly accessToken: string,
        /** Token de refresco. Permite obtener un nuevo access token. Dura ~2 meses. */
        public readonly refreshToken: string,
        /** Fecha y hora de expiración del access token. */
        public readonly expiresAt: Date,
        /** Account ID de la cuenta de PSN (normalmente "me" para el usuario autenticado). */
        public readonly accountId: string = 'me',
    ) {}

    /** True si el token ha expirado o expirará en los próximos 60 segundos. */
    isExpired(): boolean {
        return this.expiresAt.getTime() - Date.now() < 60_000;
    }
}
