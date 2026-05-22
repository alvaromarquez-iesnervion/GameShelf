/**
 * Authentication token obtained by exchanging an Epic Games authorization code.
 *
 * WARNING: this flow uses the undocumented internal Epic Games API.
 * It may stop working without notice if Epic changes its endpoints.
 */
export class EpicAuthToken {
    constructor(
        /** Bearer token for authenticated calls to the Epic API. */
        public readonly accessToken: string,
        /** Epic account ID (UUID-formatted string). */
        public readonly accountId: string,
        /** Display name of the Epic account (e.g. "PlayerName"). */
        public readonly displayName: string,
        /** Expiry date and time of the access token. */
        public readonly expiresAt: Date,
        /** Refresh token. Allows obtaining a new access token without re-authenticating. */
        public readonly refreshToken: string = '',
    ) {}

    /** Returns true if the token has expired or will expire within the next 60 seconds. */
    isExpired(): boolean {
        return this.expiresAt.getTime() - Date.now() < 60_000;
    }
}
