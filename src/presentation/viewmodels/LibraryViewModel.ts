import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { ILibraryUseCase } from '../../domain/interfaces/usecases/library/ILibraryUseCase';
import { Game } from '../../domain/entities/Game';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
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
        if (!this._searchQuery.trim()) {
            return this._games;
        }
        const query = this._searchQuery.toLowerCase();
        return this._games.filter(game =>
            game.getTitle().toLowerCase().includes(query)
        );
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

    /**
     * Llamado al arrancar la app tras autenticarse.
     * 1. Carga la biblioteca Firestore inmediatamente (respuesta rápida).
     * 2. Si el usuario tiene plataformas vinculadas y no hemos sincronizado
     *    en esta sesión, lanza una sincronización en background para cada
     *    plataforma y actualiza la UI cuando termina.
     */
    async autoSyncIfNeeded(userId: string): Promise<void> {
        if (this._hasSynced) return;

        // Carga rápida desde Firestore (lo que ya está guardado)
        await this.loadLibrary(userId);

        const platforms = this._linkedPlatforms;
        if (platforms.length === 0) return;

        // Sincronización en background — no bloquea la UI
        runInAction(() => {
            this._isSyncing = true;
            this._hasSynced = true;
        });

        try {
            const results = await Promise.allSettled(
                platforms.map(p => this.libraryUseCase.syncLibrary(userId, p.getPlatform())),
            );

            // Reunir todos los juegos de todas las plataformas sincronizadas
            const allGames: Game[] = [];
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    allGames.push(...result.value);
                }
            }

            if (allGames.length > 0) {
                runInAction(() => {
                    this._games = allGames;
                });
            }
        } catch (error) {
            // El error de sync no es crítico — la biblioteca en caché sigue disponible
            const message = error instanceof Error ? error.message : String(error);
            runInAction(() => {
                this._errorMessage = message;
            });
        } finally {
            runInAction(() => {
                this._isSyncing = false;
            });
        }
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
