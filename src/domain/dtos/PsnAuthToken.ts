/**
 * Authentication token obtained by exchanging a PlayStation Network NPSSO token.
 *
 * WARNING: PSN has no public third-party API. This flow uses reverse-engineered
 * internal endpoints (used by the official PlayStation app and website).
 * It may stop working without notice if Sony changes its endpoints.
 */
export class PsnAuthToken {
    constructor(
        /** Bearer token for authenticated calls to the PSN API. Valid for a few hours. */
        public readonly accessToken: string,
        /** Refresh token. Allows obtaining a new access token. Valid for ~2 months. */
        public readonly refreshToken: string,
        /** Expiry date and time of the access token. */
        public readonly expiresAt: Date,
        /** PSN account ID (typically "me" for the authenticated user). */
        public readonly accountId: string = 'me',
    ) {}

    /** Returns true if the token has expired or will expire within the next 60 seconds. */
    isExpired(): boolean {
        return this.expiresAt.getTime() - Date.now() < 60_000;
    }
}
