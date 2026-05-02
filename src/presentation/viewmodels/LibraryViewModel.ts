import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { ILibraryUseCase } from '../../domain/interfaces/usecases/library/ILibraryUseCase';
import { LibraryStats } from '../../domain/entities/LibraryStats';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { LibraryTab } from '../../domain/enums/LibraryTab';
import { SortCriteria } from '../../domain/enums/SortCriteria';
import { MergedLibraryGame } from '../../domain/interfaces/repositories/IGameRepository';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';

const LIBRARY_PAGE_SIZE = 20;

/**
 * ViewModel para la biblioteca de juegos.
 *
 * Singleton: compartido entre pantallas para evitar recargas innecesarias.
 * La paginación, filtrado y ordenación se realizan server-side.
 */
@injectable()
export class LibraryViewModel {
    private _games: MergedLibraryGame[] = [];
    private _linkedPlatforms: LinkedPlatform[] = [];
    private _stats: LibraryStats | null = null;
    private _isLoading: boolean = false;
    private _isSyncing: boolean = false;
    private _searchQuery: string = '';
    private _sortCriteria: SortCriteria = SortCriteria.ALPHABETICAL;
    private _errorMessage: string | null = null;
    private _hasSynced: boolean = false;
    private _activeTab: LibraryTab = LibraryTab.PC;
    private _currentUserId: string = '';
    private _currentPage: number = 1;
    private _totalPages: number = 0;
    private _selectedPlatforms: Platform[] = [];
    private _isLoadingMore: boolean = false;

    constructor(
        @inject(TYPES.ILibraryUseCase)
        private readonly libraryUseCase: ILibraryUseCase,
    ) {
        makeAutoObservable(this);
    }

    get games(): MergedLibraryGame[] {
        return this._games;
    }

    get activeTab(): LibraryTab {
        return this._activeTab;
    }

    get pcGameCount(): number {
        if (this._stats) return this._stats.pcUnique;
        return 0;
    }

    get consoleGameCount(): number {
        if (this._stats) return this._stats.consoleUnique;
        return 0;
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

    get totalUniqueCount(): number {
        if (this._stats) return this._stats.totalUnique;
        return this._games.length;
    }

    get currentPage(): number {
        return this._currentPage;
    }

    get totalPages(): number {
        return this._totalPages;
    }

    get selectedPlatforms(): Platform[] {
        return this._selectedPlatforms;
    }

    get isLoadingMore(): boolean {
        return this._isLoadingMore;
    }

    async loadLibrary(userId: string, page: number = 1): Promise<void> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
            this._currentUserId = userId;
        });
        try {
            const [result, platforms, stats] = await Promise.all([
                this.libraryUseCase.getLibraryPage(
                    userId,
                    LIBRARY_PAGE_SIZE,
                    page,
                    this._activeTab,
                    this._sortCriteria,
                    this._searchQuery || undefined,
                    this._selectedPlatforms.length > 0 ? this._selectedPlatforms : undefined,
                ),
                this.libraryUseCase.getLinkedPlatforms(userId),
                this.libraryUseCase.getLibraryStats(userId),
            ]);
            runInAction(() => {
                this._games = result.games;
                this._linkedPlatforms = platforms;
                this._stats = stats;
                this._currentPage = page;
                this._totalPages = Math.ceil(result.total / LIBRARY_PAGE_SIZE);
                this._isLoading = false;
                this._isLoadingMore = false;
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            runInAction(() => {
                this._errorMessage = message;
                this._isLoading = false;
                this._isLoadingMore = false;
            });
        }
    }

    loadMore(): void {
        if (this._currentPage < this._totalPages && !this._isLoadingMore) {
            runInAction(() => { this._isLoadingMore = true; });
            this.loadLibrary(this._currentUserId, this._currentPage + 1);
        }
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this._totalPages && page !== this._currentPage) {
            this.loadLibrary(this._currentUserId, page);
        }
    }

    goToFirstPage(): void {
        if (this._currentPage > 1) {
            this.loadLibrary(this._currentUserId, 1);
        }
    }

    goToLastPage(): void {
        if (this._currentPage < this._totalPages) {
            this.loadLibrary(this._currentUserId, this._totalPages);
        }
    }

    async syncLibrary(userId: string, platform: Platform): Promise<void> {
        await withLoading(this, '_isSyncing', '_errorMessage', async () => {
            await this.libraryUseCase.syncLibrary(userId, platform);
            const [gamesResult, platforms] = await Promise.all([
                this.libraryUseCase.getLibraryPage(
                    userId, LIBRARY_PAGE_SIZE, 1,
                    this._activeTab, this._sortCriteria,
                    this._searchQuery || undefined,
                    this._selectedPlatforms.length > 0 ? this._selectedPlatforms : undefined,
                ),
                this.libraryUseCase.getLinkedPlatforms(userId),
            ]);
            runInAction(() => {
                this._games = gamesResult.games;
                this._linkedPlatforms = platforms;
                this._currentPage = 1;
                this._totalPages = Math.ceil(gamesResult.total / LIBRARY_PAGE_SIZE);
            });
        });
    }

    setActiveTab(tab: LibraryTab): void {
        this._activeTab = tab;
        this._selectedPlatforms = [];
        this._searchQuery = '';
        this._currentPage = 1;
        if (this._currentUserId) {
            this.loadLibrary(this._currentUserId, 1);
        }
    }

    setSearchQuery(query: string): void {
        this._searchQuery = query;
        this._currentPage = 1;
        if (this._currentUserId) {
            this.loadLibrary(this._currentUserId, 1);
        }
    }

    clearSearch(): void {
        this._searchQuery = '';
        this._currentPage = 1;
        if (this._currentUserId) {
            this.loadLibrary(this._currentUserId, 1);
        }
    }

    setSortCriteria(criteria: SortCriteria): void {
        this._sortCriteria = criteria;
        this._currentPage = 1;
        if (this._currentUserId) {
            this.loadLibrary(this._currentUserId, 1);
        }
    }

    setSelectedPlatforms(platforms: Platform[]): void {
        this._selectedPlatforms = platforms;
        this._currentPage = 1;
        if (this._currentUserId) {
            this.loadLibrary(this._currentUserId, 1);
        }
    }

    togglePlatform(platform: Platform): void {
        const exists = this._selectedPlatforms.includes(platform);
        if (exists) {
            this._selectedPlatforms = this._selectedPlatforms.filter(p => p !== platform);
        } else {
            this._selectedPlatforms = [...this._selectedPlatforms, platform];
        }
        this._currentPage = 1;
        if (this._currentUserId) {
            this.loadLibrary(this._currentUserId, 1);
        }
    }

    /**
     * Llamado al arrancar la app tras autenticarse.
     * Carga página 1 de la biblioteca, plataformas y stats en paralelo.
     */
    async autoSyncIfNeeded(userId: string): Promise<void> {
        if (this._hasSynced) return;

        runInAction(() => {
            this._hasSynced = true;
            this._isLoading = true;
            this._currentUserId = userId;
        });

        try {
            const [result, platforms, stats] = await Promise.all([
                this.libraryUseCase.getLibraryPage(
                    userId, LIBRARY_PAGE_SIZE, 1,
                    this._activeTab, this._sortCriteria,
                ),
                this.libraryUseCase.getLinkedPlatforms(userId),
                this.libraryUseCase.getLibraryStats(userId),
            ]);
            runInAction(() => {
                this._games = result.games;
                this._linkedPlatforms = platforms;
                this._stats = stats;
                this._currentPage = 1;
                this._totalPages = Math.ceil(result.total / LIBRARY_PAGE_SIZE);
                this._isLoading = false;
            });

            if (platforms.length === 0) return;

            runInAction(() => { this._isSyncing = true; });

            try {
                const synced = await this.libraryUseCase.autoSyncLibrary(userId);
                if (synced.length > 0) {
                    // Recargar página 1 después del sync para tener datos actualizados
                    const refreshed = await this.libraryUseCase.getLibraryPage(
                        userId, LIBRARY_PAGE_SIZE, 1,
                        this._activeTab, this._sortCriteria,
                    );
                    runInAction(() => {
                        this._games = refreshed.games;
                        this._totalPages = Math.ceil(refreshed.total / LIBRARY_PAGE_SIZE);
                    });
                }
            } catch (error) {
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

    /** Limpia todo el estado al cerrar sesión para que el siguiente usuario empiece limpio. */
    reset(): void {
        runInAction(() => {
            this._games = [];
            this._linkedPlatforms = [];
            this._stats = null;
            this._isLoading = false;
            this._isSyncing = false;
            this._searchQuery = '';
            this._sortCriteria = SortCriteria.ALPHABETICAL;
            this._errorMessage = null;
            this._hasSynced = false;
            this._activeTab = LibraryTab.PC;
            this._currentUserId = '';
            this._currentPage = 1;
            this._totalPages = 0;
            this._selectedPlatforms = [];
            this._isLoadingMore = false;
        });
    }

    /** @deprecated Usar reset(). Conservado por compatibilidad con RootNavigator. */
    resetSyncState(): void {
        this.reset();
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
