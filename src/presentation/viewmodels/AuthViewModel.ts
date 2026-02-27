import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IAuthRepository } from '../../domain/interfaces/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';
import { TYPES } from '../../di/types';
import { BaseViewModel } from './BaseViewModel';

/**
 * ViewModel para autenticación.
 * 
 * Singleton: estado de auth global compartido en toda la app.
 * Depende directamente de IAuthRepository (sin use case intermedio).
 */
@injectable()
export class AuthViewModel extends BaseViewModel {
    private _currentUser: User | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.IAuthRepository)
        private readonly authRepository: IAuthRepository,
    ) {
        super();
        makeAutoObservable(this);
    }

    get isAuthenticated(): boolean {
        return !!this._currentUser;
    }

    get currentUser(): User | null {
        return this._currentUser;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    async login(email: string, password: string): Promise<boolean> {
        const result = await this.withLoading('_isLoading', '_errorMessage', async () => {
            const user = await this.authRepository.login(email, password);
            runInAction(() => {
                this._currentUser = user;
            });
            return true;
        });
        return result ?? false;
    }

    async register(email: string, password: string): Promise<boolean> {
        const result = await this.withLoading('_isLoading', '_errorMessage', async () => {
            const user = await this.authRepository.register(email, password);
            runInAction(() => {
                this._currentUser = user;
            });
            return true;
        });
        return result ?? false;
    }

    async logout(): Promise<void> {
        await this.withLoading('_isLoading', '_errorMessage', async () => {
            await this.authRepository.logout();
            runInAction(() => {
                this._currentUser = null;
            });
        });
    }

    async checkAuthState(): Promise<void> {
        // Note: errors are silenced here — a failed auth check just leaves the user logged out.
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });
        try {
            const user = await this.authRepository.getCurrentUser();
            runInAction(() => {
                this._currentUser = user;
            });
        } catch {
            runInAction(() => {
                this._currentUser = null;
            });
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    async deleteAccount(): Promise<void> {
        // rethrow=true so callers can react to the failure
        await this.withLoading('_isLoading', '_errorMessage', async () => {
            await this.authRepository.deleteAccount();
            runInAction(() => {
                this._currentUser = null;
            });
        }, true);
    }

    async resetPassword(email: string): Promise<boolean> {
        const result = await this.withLoading('_isLoading', '_errorMessage', async () => {
            await this.authRepository.resetPassword(email);
            return true;
        });
        return result ?? false;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
