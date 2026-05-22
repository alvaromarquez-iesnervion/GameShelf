import { LinkedPlatform } from '../../../entities/LinkedPlatform';
import { Platform } from '../../../enums/Platform';

export interface IPlatformLinkUseCase {
    /** Builds the Steam OpenID 2.0 URL to open in WebView. */
    getSteamLoginUrl(returnUrl: string): string;
    /** Returns the Epic login URL that ends at the auth code screen. */
    getEpicLoginUrl(): string;
    /**
     * Returns the URL the user must open in a browser to sign in to Epic Games
     * and obtain the authorization code.
     */
    getEpicAuthUrl(): string;
    /**
     * Completes the Steam OpenID 2.0 flow:
     *  1. verifyOpenIdResponse
     *  2. extractSteamIdFromCallback
     *  3. checkProfileVisibility
     *  4. linkSteamPlatform
     *  5. Steam syncLibrary
     */
    linkSteam(userId: string, callbackUrl: string, params: Record<string, string>): Promise<LinkedPlatform>;
    /**
     * Direct link via SteamID or profile URL.
     * Alternative to linkSteam that does not require the OpenID WebBrowser flow
     * (Steam rejects custom URL schemes as return_to).
     *  1. resolveSteamId → SteamID 64-bit
     *  2. checkProfileVisibility → must be public
     *  3. linkSteamPlatform
     *  4. Steam syncLibrary
     */
    linkSteamById(userId: string, profileUrlOrId: string): Promise<LinkedPlatform>;
    /**
     * Automatic Epic Games link via authorization code (unofficial internal API).
     * Preferred flow — the user only copies a short code from the browser:
     *  1. exchangeAuthCode → EpicAuthToken
     *  2. fetchLibrary → Game[]
     *  3. storeEpicGames
     *  4. linkEpicPlatform (with real accountId)
     *  5. Epic syncLibrary (non-blocking)
     *
     * WARNING: uses Epic's internal API. May stop working without notice.
     */
    linkEpicByAuthCode(userId: string, authCode: string): Promise<LinkedPlatform>;
    /**
     * Manual Epic link via GDPR export (fallback method).
     * Requires the user to request and download their data at epicgames.com/account/privacy.
     *  1. parseExportedLibrary (GDPR JSON)
     *  2. storeEpicGames
     *  3. linkEpicPlatform
     *  4. Epic syncLibrary (non-blocking)
     */
    linkEpic(userId: string, fileContent: string): Promise<LinkedPlatform>;
    /** Returns the GOG OAuth2 URL to open in the browser. */
    getGogAuthUrl(): string;
    /**
     * Links GOG using the authorization code captured from the redirect URL.
     *  1. exchangeAuthCode → GogAuthToken
     *  2. linkGogPlatform (stores tokens in Firestore)
     *  3. GOG syncLibrary (non-blocking)
     */
    linkGogByCode(userId: string, code: string): Promise<LinkedPlatform>;
    /** Returns the PlayStation OAuth URL. */
    getPsnLoginUrl(): string;
    /** Opens the system browser for PSN login and returns the access code. */
    authenticatePsn(): Promise<string>;
    /**
     * Links PlayStation Network using the access code obtained from the browser.
     *  1. exchangeNpssoForTokens (access code → auth tokens)
     *  2. fetchPlayedGames → Game[] (validates the token)
     *  3. storePsnGames (saves to Firestore)
     *  4. linkPsnPlatform (stores tokens in SecureStore + doc in Firestore)
     *  5. PSN syncLibrary (non-blocking)
     */
    linkPsn(userId: string, accessCode: string): Promise<LinkedPlatform>;
    /** Removes the platform link and all games for that platform. */
    unlinkPlatform(userId: string, platform: Platform): Promise<void>;
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
}
