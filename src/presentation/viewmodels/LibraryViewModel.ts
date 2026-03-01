import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { ILibraryUseCase } from '../../domain/interfaces/usecases/library/ILibraryUseCase';
import { Game } from '../../domain/entities/Game';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { SortCriteria } from '../../domain/enums/SortCriteria';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';

/**
 * ViewModel para la biblioteca de juegos.
 *
 * Singleton: compartido entre pantallas para evitar recargas innecesarias.
 */
@injectable()
export class LibraryViewModel {
    private _games: Game[] = [];
    private _linkedPlatforms: LinkedPlatform[] = [];
    private _isLoading: boolean = false;
    private _isSyncing: boolean = false;
    private _searchQuery: string = '';
    private _sortCriteria: SortCriteria = SortCriteria.ALPHABETICAL;
    private _errorMessage: string | null = null;
    private _hasSynced: boolean = false;

    constructor(
        @inject(TYPES.ILibraryUseCase)
        private readonly libraryUseCase: ILibraryUseCase,
    ) {
        makeAutoObservable(this);
    }

    get games(): Game[] {
        return this._games;
    }

    get filteredGames(): Game[] {
        // 1. Filtrado por búsqueda
        const query = this._searchQuery.trim().toLowerCase();
        const filtered = query
            ? this._games.filter(game => game.getTitle().toLowerCase().includes(query))
            : [...this._games];

        // 2. Ordenación — slice implícito evita mutar el array original
        switch (this._sortCriteria) {
            case SortCriteria.ALPHABETICAL:
                return filtered.sort((a, b) => a.getTitle().localeCompare(b.getTitle()));
            case SortCriteria.LAST_PLAYED: {
                return filtered.sort((a, b) => {
                    const aTime = a.getLastPlayed()?.getTime() ?? 0;
                    const bTime = b.getLastPlayed()?.getTime() ?? 0;
                    return bTime - aTime; // más reciente primero
                });
            }
            case SortCriteria.PLAYTIME:
                return filtered.sort((a, b) => b.getPlaytime() - a.getPlaytime()); // mayor primero
            default:
                return filtered;
        }
    }

    get sortCriteria(): SortCriteria {
        return this._sortCriteria;
    }

    get linkedPlatforms(): LinkedPlatform[] {
        return this._linkedPlatforms;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get isSyncing(): boolean {
        return this._isSyncing;
    }

    get searchQuery(): string {
        return this._searchQuery;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    async loadLibrary(userId: string): Promise<void> {
        await withLoading(this, '_isLoading', '_errorMessage', async () => {
            const [games, platforms] = await Promise.all([
                this.libraryUseCase.getLibrary(userId),
                this.libraryUseCase.getLinkedPlatforms(userId),
            ]);
            runInAction(() => {
                this._games = games;
                this._linkedPlatforms = platforms;
            });
        });
    }

    async syncLibrary(userId: string, platform: Platform): Promise<void> {
        await withLoading(this, '_isSyncing', '_errorMessage', async () => {
            const games = await this.libraryUseCase.syncLibrary(userId, platform);
            runInAction(() => {
                this._games = games;
            });
        });
    }

    setSearchQuery(query: string): void {
        this._searchQuery = query;
    }

    clearSearch(): void {
        this._searchQuery = '';
    }

    setSortCriteria(criteria: SortCriteria): void {
        this._sortCriteria = criteria;
    }

    /**
     * Llamado al arrancar la app tras autenticarse.
     * 1. Carga la biblioteca Firestore inmediatamente (respuesta rápida).
     * 2. Si el usuario tiene plataformas vinculadas y no hemos sincronizado
     *    en esta sesión, lanza una sincronización en background y actualiza la UI cuando termina.
     */
    async autoSyncIfNeeded(userId: string): Promise<void> {
        if (this._hasSynced) return;

        // Marcar hasSynced y activar isLoading antes de cualquier await para
        // cerrar la ventana de carrera con LibraryScreen (que comprueba isLoading).
        runInAction(() => {
            this._hasSynced = true;
            this._isLoading = true;
        });

        try {
            // Carga rápida desde Firestore (lo que ya está guardado)
            const [games, platforms] = await Promise.all([
                this.libraryUseCase.getLibrary(userId),
                this.libraryUseCase.getLinkedPlatforms(userId),
            ]);
            runInAction(() => {
                this._games = games;
                this._linkedPlatforms = platforms;
                this._isLoading = false;
            });

            if (platforms.length === 0) return;

            // Sincronización en background — la UI ya muestra la caché
            runInAction(() => { this._isSyncing = true; });

            try {
                const synced = await this.libraryUseCase.autoSyncLibrary(userId);
                if (synced.length > 0) {
                    runInAction(() => { this._games = synced; });
                }
            } catch (error) {
                // El error de sync no es crítico — la biblioteca en caché sigue disponible
                const message = error instanceof Error ? error.message : String(error);
                runInAction(() => { this._errorMessage = message; });
            } finally {
                runInAction(() => { this._isSyncing = false; });
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            runInAction(() => {
                this._errorMessage = message;
                this._isLoading = false;
            });
        }
    }

    /** Limpia el estado entre sesiones (logout → nuevo login/invitado en el mismo proceso). */
    resetSyncState(): void {
        runInAction(() => {
            this._hasSynced = false;
            this._games = [];
            this._linkedPlatforms = [];
        });
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
