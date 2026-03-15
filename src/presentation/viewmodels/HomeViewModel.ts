import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IHomeUseCase } from '../../domain/interfaces/usecases/home/IHomeUseCase';
import { Game } from '../../domain/entities/Game';
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
    get isLoadingHome(): boolean { return this._isLoadingHome; }
    get errorMessage(): string | null { return this._errorMessage; }

    async loadHomeData(userId: string): Promise<void> {
        // Si los datos son recientes, no relanzar los fetches
        if (Date.now() - this._lastHomeLoadTime < HOME_CACHE_TTL_MS) return;

        // Lanzar popular games en paralelo sin bloquear el resto.
        // Así el usuario ve sus datos personales (recientes/más jugados) rápido
        // mientras los juegos populares cargan en background.
        const popularPromise = this.homeUseCase.getPopularGames(10)
            .then(popular => { runInAction(() => { this._popularGames = popular; }); })
            .catch(() => { /* silent — popular games son opcionales */ });

        await withLoading(this, '_isLoadingHome', '_errorMessage', async () => {
            const [recent, mostPlayed] = await Promise.all([
                this.homeUseCase.getRecentlyPlayed(userId),
                this.homeUseCase.getMostPlayed(userId, 5),
            ]);
            runInAction(() => {
                this._recentlyPlayed = recent;
                this._mostPlayed = mostPlayed;
                this._lastHomeLoadTime = Date.now();
            });
        });

        // Esperar a que popular termine para no dejar promesas sueltas
        await popularPromise;
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

    /** Limpia todo el estado al cerrar sesión para que el siguiente usuario empiece limpio. */
    reset(): void {
        this._popularGames = [];
        this._recentlyPlayed = [];
        this._mostPlayed = [];
        this._isLoadingHome = false;
        this._errorMessage = null;
        this._lastHomeLoadTime = 0;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
