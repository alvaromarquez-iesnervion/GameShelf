import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IGameDetailUseCase } from '../../domain/interfaces/usecases/games/IGameDetailUseCase';
import { GameDetailDTO } from '../../domain/dtos/GameDetailDTO';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';
import { Platform } from '../../domain/enums/Platform';
import { ICountryPreferenceService } from '../../domain/interfaces/usecases/settings/ICountryPreferenceService';

/**
 * ViewModel for the game detail screen.
 *
 * Transient: each detail screen creates its own instance.
 */
@injectable()
export class GameDetailViewModel {
    private _gameDetail: GameDetailDTO | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;
    // Counter to discard results from stale loads (same pattern as HomeViewModel).
    private _loadId: number = 0;
    // Track current gameId/userId for reactive reload when country changes.
    private _currentGameId: string = '';
    private _currentUserId: string = '';

    constructor(
        @inject(TYPES.IGameDetailUseCase)
        private readonly gameDetailUseCase: IGameDetailUseCase,
        @inject(TYPES.ICountryPreferenceService)
        private readonly countryPrefs: ICountryPreferenceService,
    ) {
        makeAutoObservable<GameDetailViewModel, '_loadId'>(this, { _loadId: false });
    }

    get gameDetail(): GameDetailDTO | null {
        return this._gameDetail;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    async loadGameDetail(gameId: string, userId: string, steamAppId?: number | null, platform?: Platform | null): Promise<void> {
        this._currentGameId = gameId;
        this._currentUserId = userId;
        const loadId = ++this._loadId;
        await withLoading(this, '_isLoading', '_errorMessage', async () => {
            const country = this.countryPrefs.effectiveCountry;
            const detail = await this.gameDetailUseCase.getGameDetail(gameId, userId, steamAppId, platform, country);
            runInAction(() => {
                if (loadId !== this._loadId) return;
                this._gameDetail = detail;
            });
        });
    }

    /** Reloads the detail using the current gameId/userId with the effective country currency. */
    async reloadWithCountry(): Promise<void> {
        if (!this._currentGameId || !this._currentUserId) return;
        await this.loadGameDetail(this._currentGameId, this._currentUserId);
    }

    clear(): void {
        this._loadId++; // Invalidates any in-flight load
        this._gameDetail = null;
        this._errorMessage = null;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
