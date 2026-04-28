import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IGameDetailUseCase } from '../../domain/interfaces/usecases/games/IGameDetailUseCase';
import { GameDetailDTO } from '../../domain/dtos/GameDetailDTO';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';
import { Platform } from '../../domain/enums/Platform';
import { UserPreferencesStore } from '../../data/utils/UserPreferencesStore';

/**
 * ViewModel para el detalle de un juego.
 *
 * Transient: cada pantalla de detalle crea su propia instancia.
 */
@injectable()
export class GameDetailViewModel {
    private _gameDetail: GameDetailDTO | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;
    // Contador para descartar resultados de cargas obsoletas (mismo patrón que HomeViewModel).
    private _loadId: number = 0;
    // Track current gameId/userId for reactive reload when country changes.
    private _currentGameId: string = '';
    private _currentUserId: string = '';

    constructor(
        @inject(TYPES.IGameDetailUseCase)
        private readonly gameDetailUseCase: IGameDetailUseCase,
        @inject(TYPES.UserPreferencesStore)
        private readonly userPrefs: UserPreferencesStore,
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
            const country = this.userPrefs.effectiveCountry;
            const detail = await this.gameDetailUseCase.getGameDetail(gameId, userId, steamAppId, platform, country);
            runInAction(() => {
                if (loadId !== this._loadId) return;
                this._gameDetail = detail;
            });
        });
    }

    /** Recarga el detalle usando el gameId/userId actuales con la moneda del país efectivo. */
    async reloadWithCountry(): Promise<void> {
        if (!this._currentGameId || !this._currentUserId) return;
        await this.loadGameDetail(this._currentGameId, this._currentUserId);
    }

    clear(): void {
        this._loadId++; // Invalida cualquier carga en vuelo
        this._gameDetail = null;
        this._errorMessage = null;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
