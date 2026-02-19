import 'reflect-metadata';
import { injectable } from 'inversify';
import { ISteamApiService } from '../../domain/interfaces/services/ISteamApiService';
import { Game } from '../../domain/entities/Game';
import { MOCK_STEAM_GAMES, simulateDelay } from './MockDataProvider';

/**
 * Mock de ISteamApiService.
 *
 * Simula el flujo OpenID 2.0 de Steam sin abrir WebView ni llamar a Steam:
 *   - getOpenIdLoginUrl: devuelve una URL de ejemplo (no funcional)
 *   - extractSteamIdFromCallback: extrae el ID del MOCK_USER
 *   - verifyOpenIdResponse: siempre válido
 *   - getUserGames: devuelve MOCK_STEAM_GAMES
 *   - checkProfileVisibility: siempre público
 */
@injectable()
export class MockSteamApiService implements ISteamApiService {

    getOpenIdLoginUrl(returnUrl: string): string {
        // URL de ejemplo que simula la estructura OpenID real
        return `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.return_to=${encodeURIComponent(returnUrl)}&mock=true`;
    }

    extractSteamIdFromCallback(_callbackUrl: string): string {
        // Devuelve el SteamID del usuario mock
        return '76561198000000001';
    }

    async verifyOpenIdResponse(_params: Record<string, string>): Promise<boolean> {
        await simulateDelay(300);
        return true; // siempre válido en mock
    }

    async getUserGames(_steamId: string): Promise<Game[]> {
        await simulateDelay(1200); // simula llamada a API lenta
        return [...MOCK_STEAM_GAMES];
    }

    async checkProfileVisibility(_steamId: string): Promise<boolean> {
        await simulateDelay(300);
        return true; // perfil siempre público en mock
    }

    async resolveSteamId(profileUrlOrId: string): Promise<string> {
        await simulateDelay(400);
        const input = profileUrlOrId.trim();
        // Extraer SteamID si se pasa uno real de 17 dígitos
        if (/^\d{17}$/.test(input)) return input;
        const profilesMatch = input.match(/\/profiles\/(\d{17})/);
        if (profilesMatch) return profilesMatch[1];
        // Para vanity names o cualquier otra cosa, devolver el SteamID mock
        return '76561198000000001';
    }
}
