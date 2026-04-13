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

export class PlatformLinkUseCase implements IPlatformLinkUseCase {

    constructor(
        private readonly api: IGameShelfApiClient,
        private readonly platformRepository: IPlatformRepository,
    ) {}

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

    getEpicLoginUrl(): string {
        return `https://www.epicgames.com/id/login?redirectUrl=${encodeURIComponent(EPIC_AUTH_REDIRECT_URL)}`;
    }

    getEpicAuthUrl(): string {
        return EPIC_AUTH_REDIRECT_URL;
    }

    getGogAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: GOG_CLIENT_ID,
            redirect_uri: GOG_REDIRECT_URI,
            response_type: 'code',
        });
        return `https://auth.gog.com/auth?${params.toString()}`;
    }

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

    async authenticatePsn(): Promise<string> {
        throw new Error('authenticatePsn: flujo de navegador movido a PlatformLinkViewModel');
    }

    async linkSteam(
        userId: string,
        callbackUrl: string,
        params: Record<string, string>,
    ): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
        if (!params['openid.claimed_id']) throw new Error('Respuesta OpenID inválida de Steam');
        const linked = await this.api.linkSteamOpenId(callbackUrl);
        this.api.syncLibrary(Platform.STEAM).catch(() => {});
        return linked;
    }

    async linkSteamById(userId: string, profileUrlOrId: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
        const linked = await this.api.linkSteamManual(profileUrlOrId.trim());
        this.api.syncLibrary(Platform.STEAM).catch(() => {});
        return linked;
    }

    async linkEpicByAuthCode(userId: string, authCode: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
        const linked = await this.api.linkWithCode(Platform.EPIC_GAMES, authCode);
        this.api.syncLibrary(Platform.EPIC_GAMES).catch(() => {});
        return linked;
    }

    async linkEpic(userId: string, fileContent: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
        const games = this._parseEpicGdprJson(fileContent);
        if (games.length === 0) {
            throw new Error(
                'No se encontraron juegos en el archivo. ' +
                'Asegúrate de que es el JSON correcto del export GDPR de Epic Games.',
            );
        }
        const linked = await this.api.linkWithGdpr(games);
        this.api.syncLibrary(Platform.EPIC_GAMES).catch(() => {});
        return linked;
    }

    async linkGogByCode(userId: string, code: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
        const linked = await this.api.linkWithCode(Platform.GOG, code);
        this.api.syncLibrary(Platform.GOG).catch(() => {});
        return linked;
    }

    async linkPsn(userId: string, npsso: string): Promise<LinkedPlatform> {
        if (!userId?.trim()) throw new Error('userId requerido');
        if (!npsso?.trim()) throw new Error('Código de acceso PSN requerido');
        const linked = await this.api.linkWithNpsso(npsso.trim());
        this.api.syncLibrary(Platform.PSN).catch(() => {});
        return linked;
    }

    async unlinkPlatform(userId: string, platform: Platform): Promise<void> {
        if (!userId?.trim()) throw new Error('userId requerido');
        return this.platformRepository.unlinkPlatform(userId, platform);
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        if (!userId?.trim()) throw new Error('userId requerido');
        return this.platformRepository.getLinkedPlatforms(userId);
    }

    private _parseEpicGdprJson(fileContent: string): object[] {
        let parsed: unknown;
        try {
            parsed = JSON.parse(fileContent);
        } catch {
            throw new Error('El archivo no es un JSON válido de Epic Games.');
        }
        if (Array.isArray(parsed)) return parsed as object[];
        if (typeof parsed === 'object' && parsed !== null) {
            const obj = parsed as Record<string, unknown>;
            const arr = obj.entitlements ?? obj.data;
            if (Array.isArray(arr)) return arr as object[];
        }
        throw new Error('Formato de archivo no reconocido. Asegúrate de que es el export GDPR de Epic Games.');
    }
}
