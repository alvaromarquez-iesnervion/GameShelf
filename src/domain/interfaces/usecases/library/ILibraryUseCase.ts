import { Game } from '../../../entities/Game';
import { LibraryStats } from '../../../entities/LibraryStats';
import { LinkedPlatform } from '../../../entities/LinkedPlatform';
import { Platform } from '../../../enums/Platform';
import { LibraryPage } from '../../repositories/IGameRepository';
import { LibraryTab } from '../../../enums/LibraryTab';
import { SortCriteria } from '../../../enums/SortCriteria';

export interface ILibraryUseCase {
    /** Devuelve todos los juegos de la biblioteca desde caché Firestore. */
    getLibrary(userId: string): Promise<Game[]>;
    /**
     * Devuelve una página paginada y filtrada de la biblioteca.
     * El filtrado (tab, búsqueda, plataformas) y ordenación se realizan server-side.
     */
    getLibraryPage(
        userId: string,
        pageSize: number,
        page?: number,
        tab?: LibraryTab,
        sortCriteria?: SortCriteria,
        searchQuery?: string,
        platforms?: Platform[],
    ): Promise<LibraryPage>;
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
    /** Devuelve estadísticas agregadas de la biblioteca desde la API. */
    getLibraryStats(userId: string): Promise<LibraryStats>;
}
