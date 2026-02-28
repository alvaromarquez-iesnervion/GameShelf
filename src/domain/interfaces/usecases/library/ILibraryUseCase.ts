import { Game } from '../../../entities/Game';
import { LinkedPlatform } from '../../../entities/LinkedPlatform';
import { Platform } from '../../../enums/Platform';

export interface ILibraryUseCase {
    /** Devuelve todos los juegos de la biblioteca desde caché Firestore. */
    getLibrary(userId: string): Promise<Game[]>;
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
    /** Filtra la biblioteca local por título (sin llamada a red). */
    searchInLibrary(userId: string, query: string): Promise<Game[]>;
    /** Devuelve las plataformas vinculadas del usuario. */
    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]>;
}
