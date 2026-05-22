/**
 * Authentication token obtained by exchanging a GOG authorization code.
 */
export class GogAuthToken {
    constructor(
        /** Bearer token for authenticated calls to the GOG API. */
        public readonly accessToken: string,
        /** Refresh token. Allows obtaining a new access token without re-authenticating. */
        public readonly refreshToken: string,
        /** Expiry date and time of the access token. */
        public readonly expiresAt: Date,
        /** User ID of the GOG account. */
        public readonly userId: string,
    ) {}

    /** Returns true if the token has expired or will expire within the next 60 seconds. */
    isExpired(): boolean {
        return this.expiresAt.getTime() - Date.now() < 60_000;
    }
}
