import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IHomeUseCase } from '../../domain/interfaces/usecases/home/IHomeUseCase';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';

// Tiempo mínimo entre recargas del home (5 minutos).
// Cambiar de pestaña y volver dentro de este tiempo usa los datos en memoria.
const HOME_CACHE_TTL_MS = 5 * 60 * 1000;

@injectable()
export class HomeViewModel {
    private _popularGames: Game[] = [];
    private _recentlyPlayed: Game[] = [];
    private _mostPlayed: Game[] = [];
    private _searchResults: SearchResult[] = [];
    private _searchQuery: string = '';
    private _isLoadingHome: boolean = false;
    private _isSearching: boolean = false;
    private _errorMessage: string | null = null;
    private _lastHomeLoadTime: number = 0;

    constructor(
        @inject(TYPES.IHomeUseCase)
        private readonly homeUseCase: IHomeUseCase,
    ) {
        makeAutoObservable(this);
    }

    get popularGames(): Game[] { return this._popularGames; }
    get recentlyPlayed(): Game[] { return this._recentlyPlayed; }
    get mostPlayed(): Game[] { return this._mostPlayed; }
    get searchResults(): SearchResult[] { return this._searchResults; }
    get searchQuery(): string { return this._searchQuery; }
    get isLoadingHome(): boolean { return this._isLoadingHome; }
    get isSearching(): boolean { return this._isSearching; }
    get errorMessage(): string | null { return this._errorMessage; }

    async loadHomeData(userId: string): Promise<void> {
        // Si los datos son recientes, no relanzar los fetches
        if (Date.now() - this._lastHomeLoadTime < HOME_CACHE_TTL_MS) return;

        await withLoading(this, '_isLoadingHome', '_errorMessage', async () => {
            const [popular, recent, mostPlayed] = await Promise.all([
                this.homeUseCase.getPopularGames(10),
                this.homeUseCase.getRecentlyPlayed(userId),
                this.homeUseCase.getMostPlayed(userId, 5),
            ]);
            runInAction(() => {
                this._popularGames = popular;
                this._recentlyPlayed = recent;
                this._mostPlayed = mostPlayed;
                this._lastHomeLoadTime = Date.now();
            });
        });
    }

    /** Fuerza una recarga completa ignorando el TTL. Útil tras sincronizar la biblioteca. */
    async forceReloadHomeData(userId: string): Promise<void> {
        runInAction(() => { this._lastHomeLoadTime = 0; });
        await this.loadHomeData(userId);
    }

    async loadPopularGames(): Promise<void> {
        try {
            const popular = await this.homeUseCase.getPopularGames(10);
            runInAction(() => {
                this._popularGames = popular;
            });
        } catch {
            // Silent fail for popular games
        }
    }

    async search(query: string, userId: string): Promise<void> {
        if (!query.trim()) {
            runInAction(() => {
                this._searchResults = [];
                this._searchQuery = '';
            });
            return;
        }

        runInAction(() => { this._searchQuery = query; });

        await withLoading(this, '_isSearching', '_errorMessage', async () => {
            const results = await this.homeUseCase.searchGames(query, userId);
            runInAction(() => {
                this._searchResults = results;
            });
        });
    }

    clearSearch(): void {
        this._searchResults = [];
        this._searchQuery = '';
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
