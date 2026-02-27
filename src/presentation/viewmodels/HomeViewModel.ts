import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IHomeUseCase } from '../../domain/interfaces/usecases/home/IHomeUseCase';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { TYPES } from '../../di/types';
import { BaseViewModel } from './BaseViewModel';

@injectable()
export class HomeViewModel extends BaseViewModel {
    private _popularGames: Game[] = [];
    private _recentlyPlayed: Game[] = [];
    private _mostPlayed: Game[] = [];
    private _searchResults: SearchResult[] = [];
    private _searchQuery: string = '';
    private _isLoadingHome: boolean = false;
    private _isSearching: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.IHomeUseCase)
        private readonly homeUseCase: IHomeUseCase,
    ) {
        super();
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
        await this.withLoading('_isLoadingHome', '_errorMessage', async () => {
            const [popular, recent, mostPlayed] = await Promise.all([
                this.homeUseCase.getPopularGames(10),
                this.homeUseCase.getRecentlyPlayed(userId),
                this.homeUseCase.getMostPlayed(userId, 5),
            ]);
            runInAction(() => {
                this._popularGames = popular;
                this._recentlyPlayed = recent;
                this._mostPlayed = mostPlayed;
            });
        });
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

        await this.withLoading('_isSearching', '_errorMessage', async () => {
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
