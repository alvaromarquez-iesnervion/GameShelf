import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { ILibraryUseCase } from '../../domain/interfaces/usecases/library/ILibraryUseCase';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { Game } from '../../domain/entities/Game';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';

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

    constructor(
        @inject(TYPES.ILibraryUseCase)
        private readonly libraryUseCase: ILibraryUseCase,
        @inject(TYPES.IPlatformRepository)
        private readonly platformRepository: IPlatformRepository,
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
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            const [games, platforms] = await Promise.all([
                this.libraryUseCase.getLibrary(userId),
                this.platformRepository.getLinkedPlatforms(userId),
            ]);
            
            runInAction(() => {
                this._games = games;
                this._linkedPlatforms = platforms;
            });
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    async syncLibrary(userId: string, platform: Platform): Promise<void> {
        runInAction(() => {
            this._isSyncing = true;
            this._errorMessage = null;
        });

        try {
            const games = await this.libraryUseCase.syncLibrary(userId, platform);
            runInAction(() => {
                this._games = games;
            });
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
        } finally {
            runInAction(() => {
                this._isSyncing = false;
            });
        }
    }

    setSearchQuery(query: string): void {
        this._searchQuery = query;
    }

    clearSearch(): void {
        this._searchQuery = '';
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
