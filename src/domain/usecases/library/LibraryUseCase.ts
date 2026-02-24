import { ILibraryUseCase } from '../../interfaces/usecases/library/ILibraryUseCase';
import { IGameRepository } from '../../interfaces/repositories/IGameRepository';
import { Game } from '../../entities/Game';
import { Platform } from '../../enums/Platform';

/**
 * Orquesta el acceso a la biblioteca del usuario.
 *
 * - getLibrary: lee desde caché Firestore (rápido, sin red adicional).
 * - syncLibrary: llama a la API de la plataforma y actualiza Firestore (lento).
 * - searchInLibrary: filtrado local sobre los juegos en caché, sin llamada a red.
 */
export class LibraryUseCase implements ILibraryUseCase {

    constructor(
        private readonly gameRepository: IGameRepository,
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
}
