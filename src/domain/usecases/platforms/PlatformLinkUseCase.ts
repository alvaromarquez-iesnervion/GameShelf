import { IPlatformLinkUseCase } from '../../interfaces/usecases/platforms/IPlatformLinkUseCase';
import { IGameShelfApiClient } from '../../interfaces/services/IGameShelfApiClient';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { Platform } from '../../enums/Platform';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';
const EPIC_AUTH_CLIENT_ID = process.env.EXPO_PUBLIC_EPIC_CLIENT_ID ?? '';
const EPIC_AUTH_REDIRECT_URL = `https://www.epicgames.com/id/api/redirect?clientId=${EPIC_AUTH_CLIENT_ID}&responseType=code`;
const GOG_CLIENT_ID = '46899977096215655';
const GOG_REDIRECT_URI = 'https://embed.gog.com/on_login_success?origin=client';
const PSN_AUTH_BASE = 'https://ca.account.sony.com/api/authz/v3/oauth';
const PSN_CLIENT_ID = '09515159-7237-4370-9b40-3806e67c0891';
export const PSN_REDIRECT_URI = 'com.scee.psxandroid.scecompcall://redirect';

/**
 * Orchestrates platform linking flows for Steam, Epic Games, GOG, and PlayStation.
 *
 * Each platform uses a different auth protocol:
 *   - Steam    → OpenID 2.0 (WebView redirect, no token stored)
 *   - Epic     → Auth code (unofficial API) or GDPR JSON export (fallback)
 *   - GOG      → OAuth2 authorization code
 *   - PSN      → NPSSO cookie extracted from the system browser
 *
 * URL builders (getSteamLoginUrl, getEpicAuthUrl, etc.) are pure and synchronous.
 * Link methods delegate to IGameShelfApiClient and fire a non-blocking syncLibrary
 * in the background so the UI is not blocked waiting for the full library import.
 */
export class PlatformLinkUseCase implements IPlatformLinkUseCase {

    constructor(
        private readonly api: IGameShelfApiClient,
        private readonly platformRepository: IPlatformRepository,
    ) {}

    /** Builds the Steam OpenID 2.0 authorization URL. Derives the realm from returnUrl. */
    getSteamLoginUrl(returnUrl: string): string {
        let realm: string;
        try {
            const parsed = new URL(returnUrl);
            realm = `${parsed.protocol}//${parsed.host}`;
        } catch {
            realm = returnUrl;
        }
        const params = new URLSearchParams({
            'openid.ns': 'http://specs.openid.net/auth/2.0',
            'openid.mode': 'checkid_setup',
            'openid.return_to': returnUrl,
            'openid.realm': realm,
            'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
            'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        });
        return `${STEAM_OPENID_URL}?${params.toString()}`;
    }

    /** Returns the Epic login page URL that redirects to the auth code screen after sign-in. */
    getEpicLoginUrl(): string {
        return `https://www.epicgames.com/id/login?redirectUrl=${encodeURIComponent(EPIC_AUTH_REDIRECT_URL)}`;
    }

    /** Returns the Epic redirect URL where the auth code is displayed. */
    getEpicAuthUrl(): string {
        return EPIC_AUTH_REDIRECT_URL;
    }

    /** Builds the GOG OAuth2 authorization URL. */
    getGogAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: GOG_CLIENT_ID,
            redirect_uri: GOG_REDIRECT_URI,
            response_type: 'code',
        });
        return `https://auth.gog.com/auth?${params.toString()}`;
    }

    /** Builds the PlayStation Network OAuth2 authorization URL. */
    getPsnLoginUrl(): string {
        const params = new URLSearchParams({
            access_type: 'offline',
            client_id: PSN_CLIENT_ID,
            redirect_uri: PSN_REDIRECT_URI,
            response_type: 'code',
            scope: 'psn:mobile.v2.core psn:clientapp',
        });
        return `${PSN_AUTH_BASE}/authorize?${params.toString()}`;
    }

    /** Not implemented here — the browser flow is handled in PlatformLinkViewModel. */
    async authenticatePsn(): Promise<string> {
        throw new Error('authenticatePsn: browser flow moved to PlatformLinkViewModel');
    }

    /**
     * Completes the Steam OpenID 2.0 flow after the WebView redirect.
     * Validates the claimed_id parameter before delegating to the API.
     * Fires a non-blocking library sync after linking.
     */
    async linkSteam(
        userId: string,
        callbackUrl: string,
        params: Record<string, string>,
    ): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId is required');
        if (!params['openid.claimed_id']) throw new Error('Invalid OpenID response from Steam');
        const linked = await this.api.linkSteamOpenId(callbackUrl);
        this.api.syncLibrary(Platform.STEAM).catch(() => {});
        return linked;
    }

    /**
     * Links Steam directly via a SteamID or profile URL, bypassing the OpenID WebView.
     * Use when the OpenID flow is unavailable (e.g. custom URL scheme rejected by Steam).
     * Fires a non-blocking library sync after linking.
     */
    async linkSteamById(userId: string, profileUrlOrId: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId is required');
        const linked = await this.api.linkSteamManual(profileUrlOrId.trim());
        this.api.syncLibrary(Platform.STEAM).catch(() => {});
        return linked;
    }

    /**
     * Links Epic Games using the short authorization code the user copies from the browser.
     * Uses Epic's unofficial internal API — may break without notice.
     * Fires a non-blocking library sync after linking.
     */
    async linkEpicByAuthCode(userId: string, authCode: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId is required');
        const linked = await this.api.linkWithCode(Platform.EPIC_GAMES, authCode);
        this.api.syncLibrary(Platform.EPIC_GAMES).catch(() => {});
        return linked;
    }

    /**
     * Links Epic Games via a GDPR data export JSON file (fallback when the auth code flow fails).
     * Parses the file, extracts entitlements, and sends them to the backend.
     * Fires a non-blocking library sync after linking.
     */
    async linkEpic(userId: string, fileContent: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId is required');
        const games = this._parseEpicGdprJson(fileContent);
        if (games.length === 0) {
            throw new Error(
                'No games found in the file. ' +
                'Make sure it is the correct JSON from the Epic Games GDPR export.',
            );
        }
        const linked = await this.api.linkWithGdpr(games);
        this.api.syncLibrary(Platform.EPIC_GAMES).catch(() => {});
        return linked;
    }

    /**
     * Links GOG using the authorization code captured from the OAuth2 redirect URL.
     * Fires a non-blocking library sync after linking.
     */
    async linkGogByCode(userId: string, code: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId is required');
        const linked = await this.api.linkWithCode(Platform.GOG, code);
        this.api.syncLibrary(Platform.GOG).catch(() => {});
        return linked;
    }

    /**
     * Links PlayStation Network using the NPSSO cookie obtained from the system browser.
     * Fires a non-blocking library sync after linking.
     */
    async linkPsn(userId: string, npsso: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId is required');
        if (!npsso?.trim()) throw new Error('PSN access code is required');
        const linked = await this.api.linkWithNpsso(npsso.trim());
        this.api.syncLibrary(Platform.PSN).catch(() => {});
        return linked;
    }

    /** Removes the platform link and all associated games for the given platform. */
    async unlinkPlatform(userId: string, platform: Platform): Promise<void> {
        if (!userId?.trim()) throw new Error('userId is required');
        return this.platformRepository.unlinkPlatform(userId, platform);
    }

    /** Returns all platforms currently linked to the user's account. */
    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        if (!userId?.trim()) throw new Error('userId is required');
        return this.platformRepository.getLinkedPlatforms(userId);
    }

    /**
     * Parses an Epic Games GDPR export JSON file.
     * Accepts both a root array and objects with an "entitlements" or "data" key.
     */
    private _parseEpicGdprJson(fileContent: string): object[] {
        let parsed: unknown;
        try {
            parsed = JSON.parse(fileContent);
        } catch {
            throw new Error('The file is not valid Epic Games JSON.');
        }
        if (Array.isArray(parsed)) return parsed as object[];
        if (typeof parsed === 'object' && parsed !== null) {
            const obj = parsed as Record<string, unknown>;
            const arr = obj.entitlements ?? obj.data;
            if (Array.isArray(arr)) return arr as object[];
        }
        throw new Error('Unrecognised file format. Make sure it is the Epic Games GDPR export.');
    }
}
