import { injectable } from 'inversify';
import {
    exchangeAccessCodeForAuthTokens,
    exchangeRefreshTokenForAuthTokens,
    getUserPlayedGames,
} from 'psn-api';
import * as WebBrowser from 'expo-web-browser';
import { IPsnApiService } from '../../domain/interfaces/services/IPsnApiService';
import { PsnAuthToken } from '../../domain/dtos/PsnAuthToken';
import { Game } from '../../domain/entities/Game';
import { Platform } from '../../domain/enums/Platform';
import { GameType } from '../../domain/enums/GameType';

const AUTH_BASE_URL = 'https://ca.account.sony.com/api/authz/v3/oauth';
const PSN_REDIRECT_URI = 'com.scee.psxandroid.scecompcall://redirect';
const PSN_CLIENT_ID = '09515159-7237-4370-9b40-3806e67c0891';

/** Convierte una duración ISO 8601 (e.g. "PT45H23M10S") a minutos. */
function parseIso8601DurationToMinutes(duration: string): number {
    const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(duration);
    if (!match) return 0;
    const hours   = parseInt(match[1] ?? '0', 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    return hours * 60 + minutes;
}

/**
 * Rate limiter de token bucket: máximo 300 peticiones cada 15 minutos.
 * Compatible con Hermes (sin setTimeout/clearTimeout en background).
 */
class RateLimiter {
    private tokens = 300;
    private lastRefill = Date.now();
    private readonly maxTokens = 300;
    private readonly windowMs = 15 * 60 * 1000;

    canMakeRequest(): boolean {
        const now = Date.now();
        if (now - this.lastRefill >= this.windowMs) {
            this.tokens = this.maxTokens;
            this.lastRefill = now;
        }
        if (this.tokens > 0) {
            this.tokens--;
            return true;
        }
        return false;
    }
}

@injectable()
export class PsnApiServiceImpl implements IPsnApiService {
    private readonly rateLimiter = new RateLimiter();

    getPsnLoginUrl(): string {
        // Construir la URL OAuth de Sony. Si el usuario no está autenticado,
        // Sony redirige automáticamente a la página de login.
        const params = new URLSearchParams({
            access_type: 'offline',
            client_id: PSN_CLIENT_ID,
            redirect_uri: PSN_REDIRECT_URI,
            response_type: 'code',
            scope: 'psn:mobile.v2.core psn:clientapp',
        });
        return `${AUTH_BASE_URL}/authorize?${params}`;
    }

    /**
     * Abre ASWebAuthenticationSession (Safari real) con la URL OAuth de Sony.
     * El usuario hace login (passkeys funcionan), Sony redirige a
     * com.scee.psxandroid.scecompcall://redirect?code=xxx, y
     * openAuthSessionAsync intercepta ese redirect devolviendo el code.
     */
    async authenticateWithBrowser(): Promise<string> {
        const authUrl = this.getPsnLoginUrl();
        console.log('[PSN] Opening auth session...');

        const result = await WebBrowser.openAuthSessionAsync(
            authUrl,
            PSN_REDIRECT_URI,
        );

        console.log('[PSN] Auth session result:', JSON.stringify(result));

        if (result.type !== 'success' || !result.url) {
            throw new Error(
                result.type === 'cancel'
                    ? 'Login cancelado por el usuario.'
                    : `Error en la autenticación de PSN (${result.type}).`
            );
        }

        // Extraer el code de la URL de redirect
        const codeMatch = /[?&]code=([^&]+)/.exec(result.url);
        if (!codeMatch) {
            console.error('[PSN] No code in redirect URL:', result.url);
            throw new Error('No se pudo obtener el código de acceso de PSN.');
        }

        console.log('[PSN] Got access code from auth session');
        return codeMatch[1];
    }

    async exchangeNpssoForTokens(npsso: string): Promise<PsnAuthToken> {
        // Este método ahora acepta tanto un NPSSO como un access code directamente.
        // Si recibe un access code (de authenticateWithBrowser), lo usa directamente.
        console.log('[PSN Service] Exchanging code for tokens...');
        const auth = await exchangeAccessCodeForAuthTokens(npsso);
        console.log('[PSN Service] Got auth tokens successfully');

        const expiresAt = new Date(Date.now() + auth.expiresIn * 1000);
        return new PsnAuthToken(auth.accessToken, auth.refreshToken, expiresAt, 'me');
    }

    async refreshToken(refreshToken: string): Promise<PsnAuthToken> {
        const auth = await exchangeRefreshTokenForAuthTokens(refreshToken);
        const expiresAt = new Date(Date.now() + auth.expiresIn * 1000);
        return new PsnAuthToken(auth.accessToken, auth.refreshToken, expiresAt, 'me');
    }

    async fetchPlayedGames(accessToken: string): Promise<Game[]> {
        if (!this.rateLimiter.canMakeRequest()) {
            throw new Error('PSN rate limit alcanzado (300 req/15 min). Espera un momento.');
        }

        const authorization = { accessToken };
        const response = await getUserPlayedGames(authorization, 'me', { limit: 200, offset: 0 });
        const titles = (response as any)?.titles ?? [];

        return titles.map((title: any) => {
            const playtime = title.playDuration
                ? parseIso8601DurationToMinutes(title.playDuration)
                : 0;

            const lastPlayed = title.lastPlayedDateTime
                ? new Date(title.lastPlayedDateTime)
                : null;

            return new Game(
                title.titleId,
                title.name ?? 'Juego PSN',
                '',
                title.imageUrl ?? '',
                Platform.PSN,
                null,
                null,
                playtime,
                lastPlayed,
                title.imageUrl ?? '',
                GameType.GAME,
                null,
                title.titleId,
            );
        });
    }
}
