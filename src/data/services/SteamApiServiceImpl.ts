import 'reflect-metadata';
import { injectable } from 'inversify';
import axios from 'axios';
import { ISteamApiService } from '../../domain/interfaces/services/ISteamApiService';
import { Game } from '../../domain/entities/Game';
import { Platform } from '../../domain/enums/Platform';
import { STEAM_API_BASE_URL, STEAM_OPENID_URL, STEAM_CDN_BASE, STEAM_API_KEY } from '../config/ApiConstants';

interface SteamOwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    playtime_2weeks?: number;
    img_icon_url: string;
    rtime_last_played?: number;
}

interface SteamRecentGame {
    appid: number;
    name: string;
    playtime_2weeks: number;
    playtime_forever: number;
    img_icon_url: string;
}

interface SteamChartsGame {
    rank: number;
    appid: number;
    last_week_rank: number;
    peak_in_game: number;
}

interface SteamAppDetails {
    success: boolean;
    data?: {
        name: string;
        header_image: string;
        short_description: string;
    };
}

/**
 * Steam usa OpenID 2.0, NO OAuth2. No hay token de usuario que guardar.
 * Solo necesitamos el SteamID del usuario + nuestra API Key de desarrollador.
 *
 * Flujo de vinculación:
 *   1. Abrir WebView con getOpenIdLoginUrl()
 *   2. Steam redirige a la returnUrl con params openid.*
 *   3. extractSteamIdFromCallback() → SteamID 64-bit
 *   4. verifyOpenIdResponse() → validar con Steam (POST check_authentication)
 *   5. checkProfileVisibility() → asegurarse de que el perfil es público
 *   6. getUserGames() → biblioteca del usuario
 */
@injectable()
export class SteamApiServiceImpl implements ISteamApiService {

    getOpenIdLoginUrl(returnUrl: string): string {
        // Extraer realm (protocol + host) de forma segura.
        // Para custom schemes (gameshelf://) y URLs normales (https://).
        let realm: string;
        try {
            const parsed = new URL(returnUrl);
            realm = `${parsed.protocol}//${parsed.host}`;
        } catch {
            // Fallback: usar la URL completa como realm
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

    extractSteamIdFromCallback(callbackUrl: string): string {
        // openid.claimed_id = https://steamcommunity.com/openid/id/76561198XXXXXXXXX
        const params = new URL(callbackUrl).searchParams;
        const claimedId = params.get('openid.claimed_id') ?? '';
        const match = claimedId.match(/\/openid\/id\/(\d+)$/);
        if (!match) throw new Error('No se pudo extraer el SteamID de la URL de callback');
        return match[1];
    }

    async verifyOpenIdResponse(params: Record<string, string>): Promise<boolean> {
        const verifyParams = { ...params, 'openid.mode': 'check_authentication' };
        const body = new URLSearchParams(verifyParams).toString();
        const response = await axios.post(STEAM_OPENID_URL, body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        return response.data?.includes('is_valid:true') ?? false;
    }

    async getUserGames(steamId: string): Promise<Game[]> {
        const response = await axios.get(
            `${STEAM_API_BASE_URL}/IPlayerService/GetOwnedGames/v1/`,
            {
                params: {
                    key: STEAM_API_KEY,
                    steamid: steamId,
                    include_appinfo: 1,
                    include_played_free_games: 1,
                    skip_unvetted_apps: false,
                    format: 'json',
                },
            },
        );
        const games: SteamOwnedGame[] = response.data?.response?.games ?? [];
        return games.map(g => this.mapSteamGameToDomain(g));
    }

    async getRecentlyPlayedGames(steamId: string): Promise<Game[]> {
        const response = await axios.get(
            `${STEAM_API_BASE_URL}/IPlayerService/GetRecentlyPlayedGames/v1/`,
            {
                params: {
                    key: STEAM_API_KEY,
                    steamid: steamId,
                    count: 0,
                    format: 'json',
                },
            },
        );
        const games: SteamRecentGame[] = response.data?.response?.games ?? [];
        return games.map(g => this.mapRecentGameToDomain(g));
    }

    async getMostPlayedGames(limit: number = 10): Promise<Game[]> {
        const chartsResponse = await axios.get(
            `${STEAM_API_BASE_URL}/ISteamChartsService/GetMostPlayedGames/v1/`,
            {
                params: {
                    key: STEAM_API_KEY,
                },
            },
        );
        
        const ranks: SteamChartsGame[] = chartsResponse.data?.response?.ranks ?? [];
        const topGames = ranks.slice(0, limit);
        
        if (topGames.length === 0) return [];
        
        const gameDetailsPromises = topGames.map(async (chart) => {
            try {
                const detailsResponse = await axios.get(
                    'https://store.steampowered.com/api/appdetails',
                    { params: { appids: chart.appid } },
                );
                const details: SteamAppDetails = detailsResponse.data?.[chart.appid];
                if (!details?.success || !details.data) return null;
                
                return new Game(
                    chart.appid.toString(),
                    details.data.name,
                    details.data.short_description ?? '',
                    details.data.header_image,
                    Platform.STEAM,
                    chart.appid,
                    null,
                    0,
                    null,
                );
            } catch {
                return new Game(
                    chart.appid.toString(),
                    `Game ${chart.appid}`,
                    '',
                    `${STEAM_CDN_BASE}/${chart.appid}/header.jpg`,
                    Platform.STEAM,
                    chart.appid,
                    null,
                    0,
                    null,
                );
            }
        });
        
        const games = await Promise.all(gameDetailsPromises);
        return games.filter((g): g is Game => g !== null);
    }

    async checkProfileVisibility(steamId: string): Promise<boolean> {
        const response = await axios.get(
            `${STEAM_API_BASE_URL}/ISteamUser/GetPlayerSummaries/v2/`,
            {
                params: { key: STEAM_API_KEY, steamids: steamId },
            },
        );
        const player = response.data?.response?.players?.[0];
        // communityvisibilitystate === 3 → perfil público
        return player?.communityvisibilitystate === 3;
    }

    async resolveSteamId(profileUrlOrId: string): Promise<string> {
        const input = profileUrlOrId.trim();

        // 1. SteamID de 17 dígitos directamente
        if (/^\d{17}$/.test(input)) return input;

        // 2. URL con /profiles/STEAMID
        const profilesMatch = input.match(/\/profiles\/(\d{17})/);
        if (profilesMatch) return profilesMatch[1];

        // 3. URL con /id/VANITYNAME o solo el vanity name
        const vanityMatch = input.match(/\/id\/([^/?\s]+)/);
        const vanityName = vanityMatch ? vanityMatch[1] : input;

        // Llamada a ISteamUser/ResolveVanityURL/v1
        const response = await axios.get(
            `${STEAM_API_BASE_URL}/ISteamUser/ResolveVanityURL/v1/`,
            { params: { key: STEAM_API_KEY, vanityurl: vanityName } },
        );

        const result = response.data?.response;
        if (result?.success !== 1) {
            throw new Error(
                `No se encontró ninguna cuenta de Steam con el nombre "${vanityName}". ` +
                'Comprueba que la URL o el nombre de usuario son correctos.',
            );
        }
        return result.steamid as string;
    }

    // Mapper interno: SteamOwnedGame → Game de dominio
    private mapSteamGameToDomain(steamGame: SteamOwnedGame): Game {
        const appId = steamGame.appid;
        const lastPlayed = steamGame.rtime_last_played
            ? new Date(steamGame.rtime_last_played * 1000)
            : null;
        return new Game(
            appId.toString(),
            steamGame.name,
            '',
            `${STEAM_CDN_BASE}/${appId}/header.jpg`,
            Platform.STEAM,
            appId,
            null,
            steamGame.playtime_forever,
            lastPlayed,
        );
    }

    // Mapper interno: SteamRecentGame → Game de dominio (juegos jugados recientemente)
    private mapRecentGameToDomain(steamGame: SteamRecentGame): Game {
        const appId = steamGame.appid;
        const lastPlayed = new Date();
        return new Game(
            appId.toString(),
            steamGame.name,
            '',
            `${STEAM_CDN_BASE}/${appId}/header.jpg`,
            Platform.STEAM,
            appId,
            null,
            steamGame.playtime_forever,
            lastPlayed,
        );
    }
}
