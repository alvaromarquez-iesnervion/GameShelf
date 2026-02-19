import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IHomeUseCase } from '../../domain/interfaces/usecases/home/IHomeUseCase';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { TYPES } from '../../di/types';

@injectable()
export class HomeViewModel {
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
        makeAutoObservable(this);
    }

    get recentlyPlayed(): Game[] { return this._recentlyPlayed; }
    get mostPlayed(): Game[] { return this._mostPlayed; }
    get searchResults(): SearchResult[] { return this._searchResults; }
    get searchQuery(): string { return this._searchQuery; }
    get isLoadingHome(): boolean { return this._isLoadingHome; }
    get isSearching(): boolean { return this._isSearching; }
    get errorMessage(): string | null { return this._errorMessage; }

    async loadHomeData(userId: string): Promise<void> {
        runInAction(() => {
            this._isLoadingHome = true;
            this._errorMessage = null;
        });

        try {
            const [recent, mostPlayed] = await Promise.all([
                this.homeUseCase.getRecentlyPlayed(userId),
                this.homeUseCase.getMostPlayed(userId, 5),
            ]);
            runInAction(() => {
                this._recentlyPlayed = recent;
                this._mostPlayed = mostPlayed;
            });
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
        } finally {
            runInAction(() => {
                this._isLoadingHome = false;
            });
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

        runInAction(() => {
            this._isSearching = true;
            this._searchQuery = query;
            this._errorMessage = null;
        });

        try {
            const results = await this.homeUseCase.searchGames(query, userId);
            runInAction(() => {
                this._searchResults = results;
            });
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
        } finally {
            runInAction(() => {
                this._isSearching = false;
            });
        }
    }

    clearSearch(): void {
        this._searchResults = [];
        this._searchQuery = '';
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
