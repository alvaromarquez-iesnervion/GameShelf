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

const LIBRARY_PAGE_SIZE = 200;

export interface MergedLibraryGame {
    game: Game;
    platforms: Platform[];
}

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

    get mergedFilteredGames(): MergedLibraryGame[] {
        const map = new Map<string, MergedLibraryGame>();
        for (const game of this.filteredGames) {
            const steamId = game.getSteamAppId();
            const itadId = game.getItadGameId();
            const key = steamId !== null
                ? `steam-${steamId}`
                : itadId
                    ? `itad-${itadId}`
                    : `title-${game.getTitle().toLowerCase()}`;

            const existing = map.get(key);
            if (existing) {
                existing.platforms.push(game.getPlatform());
                // Prefer Steam game as canonical
                if (game.getPlatform() === Platform.STEAM) {
                    existing.game = game;
                }
            } else {
                map.set(key, { game, platforms: [game.getPlatform()] });
            }
        }
        return [...map.values()];
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
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
            this._games = [];
        });
        try {
            // Primera página y plataformas en paralelo — la UI se muestra en cuanto llegan
            const [firstPage, platforms] = await Promise.all([
                this.libraryUseCase.getLibraryPage(userId, LIBRARY_PAGE_SIZE),
                this.libraryUseCase.getLinkedPlatforms(userId),
            ]);
            runInAction(() => {
                this._games = firstPage.games;
                this._linkedPlatforms = platforms;
                this._isLoading = false;
            });

            // Páginas restantes en background — MobX actualiza la UI reactivamente
            let cursor = firstPage.nextCursor;
            while (cursor !== null) {
                const page = await this.libraryUseCase.getLibraryPage(userId, LIBRARY_PAGE_SIZE, cursor);
                runInAction(() => { this._games = [...this._games, ...page.games]; });
                cursor = page.nextCursor;
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            runInAction(() => {
                this._errorMessage = message;
                this._isLoading = false;
            });
        }
    }

    async syncLibrary(userId: string, platform: Platform): Promise<void> {
        await withLoading(this, '_isSyncing', '_errorMessage', async () => {
            await this.libraryUseCase.syncLibrary(userId, platform);
            // Recargar la biblioteca completa para no perder juegos de otras plataformas.
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
            // Primera página + plataformas en paralelo (respuesta rápida)
            const [firstPage, platforms] = await Promise.all([
                this.libraryUseCase.getLibraryPage(userId, LIBRARY_PAGE_SIZE),
                this.libraryUseCase.getLinkedPlatforms(userId),
            ]);
            runInAction(() => {
                this._games = firstPage.games;
                this._linkedPlatforms = platforms;
                this._isLoading = false;
            });

            // Páginas restantes en background antes de comenzar el sync de plataformas
            let cursor = firstPage.nextCursor;
            while (cursor !== null) {
                const page = await this.libraryUseCase.getLibraryPage(userId, LIBRARY_PAGE_SIZE, cursor);
                runInAction(() => { this._games = [...this._games, ...page.games]; });
                cursor = page.nextCursor;
            }

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
