import 'reflect-metadata';
import { injectable } from 'inversify';
import { IGogApiService } from '../../domain/interfaces/services/IGogApiService';
import { GogAuthToken } from '../../domain/dtos/GogAuthToken';
import { Game } from '../../domain/entities/Game';
import { Platform } from '../../domain/enums/Platform';

const GOG_AUTH_BASE = 'https://auth.gog.com';
const GOG_EMBED_BASE = 'https://embed.gog.com';
const GOG_CLIENT_ID = '46899977096215655';
// Credenciales públicamente conocidas (usadas por Heroic, Playnite, Lutris)
const GOG_CLIENT_SECRET = '9d85c43b1482497dbbce61f6e4aa173a433796eeae2ca8c5f6129f2dc4de46d9';
const GOG_REDIRECT_URI = 'https://embed.gog.com/on_login_success?origin=client';
const GOG_TOKEN_URL = `${GOG_AUTH_BASE}/token`;

/**
 * Implementación del servicio GOG.
 *
 * Llama directamente a auth.gog.com con las credenciales OAuth2 públicamente
 * conocidas (las mismas que usan Heroic, Playnite y Lutris).
 */
@injectable()
export class GogApiServiceImpl implements IGogApiService {

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: GOG_CLIENT_ID,
            redirect_uri: GOG_REDIRECT_URI,
            response_type: 'code',
            layout: 'client2',
        });
        return `${GOG_AUTH_BASE}/auth?${params.toString()}`;
    }

    async exchangeAuthCode(code: string): Promise<GogAuthToken> {
        const params = new URLSearchParams({
            client_id: GOG_CLIENT_ID,
            client_secret: GOG_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: GOG_REDIRECT_URI,
            code,
        });

        const response = await fetch(`${GOG_TOKEN_URL}?${params.toString()}`);

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`GOG token exchange falló (${response.status}): ${text}`);
        }

        const data = await response.json() as {
            access_token: string;
            refresh_token: string;
            expires_in: number;
            user_id: string;
        };

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            userId: data.user_id,
        };
    }

    async refreshToken(refreshToken: string): Promise<GogAuthToken> {
        const params = new URLSearchParams({
            client_id: GOG_CLIENT_ID,
            client_secret: GOG_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        });

        const response = await fetch(`${GOG_TOKEN_URL}?${params.toString()}`);

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new Error(`GOG token refresh falló (${response.status}): ${text}`);
        }

        const data = await response.json() as {
            access_token: string;
            refresh_token?: string;
            expires_in: number;
            user_id?: string;
        };

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? refreshToken,
            expiresAt: new Date(Date.now() + data.expires_in * 1000),
            userId: data.user_id ?? '',
        };
    }

    async getUserGames(accessToken: string): Promise<Game[]> {
        const url = `${GOG_EMBED_BASE}/account/getFilteredProducts?mediaType=1&sortBy=title`;
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': 'GOG Galaxy Client',
            },
        });

        if (!response.ok) {
            throw new Error(`GOG getFilteredProducts falló (${response.status})`);
        }

        const data = await response.json() as {
            products?: {
                id: number;
                title: string;
                image: string;
                slug?: string;
            }[];
        };

        return (data.products ?? []).map(p => new Game(
            `gog_${p.id}`,
            p.title,
            '',
            p.image ? `https:${p.image}_196.jpg` : '',
            Platform.GOG,
            null,
            null,
            0,
            null,
        ));
    }
}
