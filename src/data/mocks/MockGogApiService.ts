import 'reflect-metadata';
import { injectable } from 'inversify';
import { IGogApiService } from '../../domain/interfaces/services/IGogApiService';
import { GogAuthToken } from '../../domain/dtos/GogAuthToken';
import { Game } from '../../domain/entities/Game';

/**
 * Mock de IGogApiService.
 * Se usa en modo Steam-only o mock completo donde GOG no está disponible.
 * Todos los métodos lanzan un error indicando que GOG no está configurado.
 */
@injectable()
export class MockGogApiService implements IGogApiService {

    getAuthUrl(): string {
        throw new Error('GOG no está disponible en este modo de operación.');
    }

    async exchangeAuthCode(_code: string): Promise<GogAuthToken> {
        throw new Error('GOG no está disponible en este modo de operación.');
    }

    async refreshToken(_refreshToken: string): Promise<GogAuthToken> {
        throw new Error('GOG no está disponible en este modo de operación.');
    }

    async getUserGames(_accessToken: string): Promise<Game[]> {
        return [];
    }
}
