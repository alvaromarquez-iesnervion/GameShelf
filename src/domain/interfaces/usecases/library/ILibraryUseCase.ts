import { Game } from '../../../entities/Game';
import { Platform } from '../../../enums/Platform';

export interface ILibraryUseCase {
    /** Devuelve todos los juegos de la biblioteca desde caché Firestore. */
    getLibrary(userId: string): Promise<Game[]>;
    /**
     * Lanza sincronización con la API de la plataforma indicada y actualiza Firestore.
     * Itera todas las plataformas vinculadas si no se especifica platform.
     */
    syncLibrary(userId: string, platform: Platform): Promise<Game[]>;
    /** Filtra la biblioteca local por título (sin llamada a red). */
    searchInLibrary(userId: string, query: string): Promise<Game[]>;
}
