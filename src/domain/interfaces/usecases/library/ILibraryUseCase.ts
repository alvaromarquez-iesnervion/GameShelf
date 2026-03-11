import { Game } from '../../../entities/Game';
import { LinkedPlatform } from '../../../entities/LinkedPlatform';
import { Platform } from '../../../enums/Platform';
import { LibraryPage } from '../../repositories/IGameRepository';

export interface ILibraryUseCase {
    /** Devuelve todos los juegos de la biblioteca desde caché Firestore. */
    getLibrary(userId: string): Promise<Game[]>;
    /**
     * Devuelve una página de la biblioteca ordenada por ID.
     * Usar para carga progresiva en la pantalla de biblioteca.
     */
    getLibraryPage(userId: string, pageSize: number, cursor?: string): Promise<LibraryPage>;
    /**
     * Lanza sincronización con la API de la plataforma indicada y actualiza Firestore.
     * Itera todas las plataformas vinculadas si no se especifica platform.
     */
    syncLibrary(userId: string, platform: Platform): Promise<Game[]>;
    /**
     * Sincroniza todas las plataformas vinculadas del usuario.
     * Usado en autoSync al inicio de sesión. Retorna la biblioteca unificada.
     */
    autoSyncLibrary(userId: string): Promise<Game[]>;
    /** Devuelve las plataformas vinculadas del usuario. */
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
}
