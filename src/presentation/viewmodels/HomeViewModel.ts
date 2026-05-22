import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IHomeUseCase } from '../../domain/interfaces/usecases/home/IHomeUseCase';
import { Game } from '../../domain/entities/Game';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';

// Minimum time between home reloads (5 minutes).
// Switching tabs and returning within this window uses the in-memory data.
const HOME_CACHE_TTL_MS = 5 * 60 * 1000;

@injectable()
export class HomeViewModel {
    private _popularGames: Game[] = [];
    private _recentlyPlayed: Game[] = [];
    private _mostPlayed: Game[] = [];
    private _isSteamLinked: boolean = false;
    private _isLoadingHome: boolean = false;
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
    get isSteamLinked(): boolean { return this._isSteamLinked; }
    get isLoadingHome(): boolean { return this._isLoadingHome; }
    get errorMessage(): string | null { return this._errorMessage; }

    async loadHomeData(userId: string): Promise<void> {
        // If data is recent, skip re-fetching
        if (Date.now() - this._lastHomeLoadTime < HOME_CACHE_TTL_MS) return;

        // Fetch popular games in parallel without blocking the rest.
        // This lets the user see their personal data (recent/most played) quickly
        // while popular games load in the background.
        const popularPromise = this.homeUseCase.getPopularGames(10)
            .then(popular => { runInAction(() => { this._popularGames = popular; }); })
            .catch(() => { /* silent — popular games are optional */ });

        await withLoading(this, '_isLoadingHome', '_errorMessage', async () => {
            const [recent, mostPlayed, steamLinked] = await Promise.all([
                this.homeUseCase.getRecentlyPlayed(userId),
                this.homeUseCase.getMostPlayed(userId, 5),
                this.homeUseCase.isSteamLinked(userId),
            ]);
            runInAction(() => {
                this._recentlyPlayed = recent;
                this._mostPlayed = mostPlayed;
                this._isSteamLinked = steamLinked;
                this._lastHomeLoadTime = Date.now();
            });
        });

        // Await popular so no dangling promises are left hanging
        await popularPromise;
    }

    /** Forces a full reload ignoring the TTL. Useful after syncing the library. */
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

    /** Clears all state on logout so the next user starts with a clean slate. */
    reset(): void {
        this._popularGames = [];
        this._recentlyPlayed = [];
        this._mostPlayed = [];
        this._isSteamLinked = false;
        this._isLoadingHome = false;
        this._errorMessage = null;
        this._lastHomeLoadTime = 0;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
