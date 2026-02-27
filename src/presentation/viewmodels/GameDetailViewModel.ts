import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IGameDetailUseCase } from '../../domain/interfaces/usecases/games/IGameDetailUseCase';
import { GameDetailDTO } from '../../domain/dtos/GameDetailDTO';
import { TYPES } from '../../di/types';
import { BaseViewModel } from './BaseViewModel';

/**
 * ViewModel para el detalle de un juego.
 * 
 * Transient: cada pantalla de detalle crea su propia instancia.
 */
@injectable()
export class GameDetailViewModel extends BaseViewModel {
    private _gameDetail: GameDetailDTO | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.IGameDetailUseCase)
        private readonly gameDetailUseCase: IGameDetailUseCase,
    ) {
        super();
        makeAutoObservable(this);
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

    async loadGameDetail(gameId: string, userId: string, steamAppId?: number): Promise<void> {
        await this.withLoading('_isLoading', '_errorMessage', async () => {
            const detail = await this.gameDetailUseCase.getGameDetail(gameId, userId, steamAppId);
            runInAction(() => {
                this._gameDetail = detail;
            });
        });
    }

    clear(): void {
        this._gameDetail = null;
        this._errorMessage = null;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
