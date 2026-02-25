import { ILibraryUseCase } from '../../interfaces/usecases/library/ILibraryUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { Game } from '../../entities/Game';
import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { Platform } from '../../enums/Platform';

/**
 * Orquesta el acceso a la biblioteca del usuario.
 *
 * - getLibrary: lee desde caché Firestore (rápido, sin red adicional).
 * - syncLibrary: llama a la API de la plataforma y actualiza Firestore (lento).
 * - searchInLibrary: filtrado local sobre los juegos en caché, sin llamada a red.
 * - getLinkedPlatforms: devuelve las plataformas vinculadas del usuario.
 */
export class LibraryUseCase implements ILibraryUseCase {

    constructor(
        private readonly gameRepository: IGameRepository,
        private readonly platformRepository: IPlatformRepository,
    ) {}

    async getLibrary(userId: string): Promise<Game[]> {
        return this.gameRepository.getLibraryGames(userId);
    }

    async syncLibrary(userId: string, platform: Platform): Promise<Game[]> {
        return this.gameRepository.syncLibrary(userId, platform);
    }

    async searchInLibrary(userId: string, query: string): Promise<Game[]> {
        if (!query.trim()) return [];
        const games = await this.gameRepository.getLibraryGames(userId);
        const lower = query.toLowerCase();
        return games.filter(g => g.getTitle().toLowerCase().includes(lower));
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        return this.platformRepository.getLinkedPlatforms(userId);
    }
}
