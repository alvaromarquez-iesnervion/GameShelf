export interface GogAuthToken {
    accessToken: string;
    refreshToken: string;
    /** Unix timestamp (ms) at which the access token expires. */
    expiresAt: Date;
    userId: string;
}
