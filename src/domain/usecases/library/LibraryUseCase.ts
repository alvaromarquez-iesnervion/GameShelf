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
 * - getLinkedPlatforms: devuelve las plataformas vinculadas del usuario.
 *
 * Nota: el filtrado/búsqueda por título se realiza en LibraryViewModel (computed MobX),
 * evitando llamadas a red innecesarias y aprovechando la reactividad del estado en memoria.
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

    async autoSyncLibrary(userId: string): Promise<Game[]> {
        // 1. Obtener plataformas vinculadas
        const platforms = await this.platformRepository.getLinkedPlatforms(userId);
        
        if (platforms.length === 0) {
            // Sin plataformas, retornar biblioteca vacía o caché existente
            return this.gameRepository.getLibraryGames(userId);
        }

        // 2. Sincronizar todas las plataformas en paralelo con Promise.allSettled
        const results = await Promise.allSettled(
            platforms.map(p => this.gameRepository.syncLibrary(userId, p.getPlatform())),
        );

        // 3. Combinar todos los juegos de plataformas exitosas, deduplicando por ID
        const seen = new Map<string, Game>();
        for (const result of results) {
            if (result.status === 'fulfilled') {
                for (const game of result.value) {
                    seen.set(game.getId(), game);
                }
            }
        }

        return Array.from(seen.values());
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        return this.platformRepository.getLinkedPlatforms(userId);
    }
}
