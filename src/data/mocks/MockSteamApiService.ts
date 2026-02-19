import 'reflect-metadata';
import { injectable } from 'inversify';
import { ISteamApiService } from '../../domain/interfaces/services/ISteamApiService';
import { Game } from '../../domain/entities/Game';
import { MOCK_STEAM_GAMES, MOCK_RECENTLY_PLAYED, MOCK_POPULAR_GAMES, simulateDelay } from './MockDataProvider';

/**
 * Mock de ISteamApiService.
 *
 * Simula el flujo OpenID 2.0 de Steam sin abrir WebView ni llamar a Steam:
 *   - getOpenIdLoginUrl: devuelve una URL de ejemplo (no funcional)
 *   - extractSteamIdFromCallback: extrae el ID del MOCK_USER
 *   - verifyOpenIdResponse: siempre válido
 *   - getUserGames: devuelve MOCK_STEAM_GAMES con playtime
 *   - getRecentlyPlayedGames: devuelve MOCK_RECENTLY_PLAYED
 *   - getMostPlayedGames: devuelve MOCK_POPULAR_GAMES
 *   - checkProfileVisibility: siempre público
 */
@injectable()
export class MockSteamApiService implements ISteamApiService {

    getOpenIdLoginUrl(returnUrl: string): string {
        return `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.return_to=${encodeURIComponent(returnUrl)}&mock=true`;
    }

    extractSteamIdFromCallback(_callbackUrl: string): string {
        return '76561198000000001';
    }

    async verifyOpenIdResponse(_params: Record<string, string>): Promise<boolean> {
        await simulateDelay(300);
        return true;
    }

    async getUserGames(_steamId: string): Promise<Game[]> {
        await simulateDelay(1200);
        return [...MOCK_STEAM_GAMES];
    }

    async getRecentlyPlayedGames(_steamId: string): Promise<Game[]> {
        await simulateDelay(800);
        return [...MOCK_RECENTLY_PLAYED];
    }

    async getMostPlayedGames(limit: number = 10): Promise<Game[]> {
        await simulateDelay(600);
        return MOCK_POPULAR_GAMES.slice(0, limit);
    }

    async checkProfileVisibility(_steamId: string): Promise<boolean> {
        await simulateDelay(300);
        return true;
    }

    async resolveSteamId(profileUrlOrId: string): Promise<string> {
        await simulateDelay(400);
        const input = profileUrlOrId.trim();
        if (/^\d{17}$/.test(input)) return input;
        const profilesMatch = input.match(/\/profiles\/(\d{17})/);
        if (profilesMatch) return profilesMatch[1];
        return '76561198000000001';
    }
}
