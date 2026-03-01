import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IAuthUseCase } from '../../domain/interfaces/usecases/auth/IAuthUseCase';
import { User } from '../../domain/entities/User';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';
import { isGuestUser } from '../../core/utils/guestUtils';

/**
 * ViewModel para autenticación.
 *
 * Singleton: estado de auth global compartido en toda la app.
 * Delega toda la lógica de negocio a IAuthUseCase.
 */
@injectable()
export class AuthViewModel {
    private _currentUser: User | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.IAuthUseCase)
        private readonly authUseCase: IAuthUseCase,
    ) {
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

    get isGuest(): boolean {
        return this._currentUser != null && isGuestUser(this._currentUser.getId());
    }

    async login(email: string, password: string): Promise<boolean> {
        const result = await withLoading(this, '_isLoading', '_errorMessage', async () => {
            const user = await this.authUseCase.login(email, password);
            runInAction(() => {
                this._currentUser = user;
            });
            return true;
        });
        return result ?? false;
    }

    async register(email: string, password: string): Promise<boolean> {
        const result = await withLoading(this, '_isLoading', '_errorMessage', async () => {
            const user = await this.authUseCase.register(email, password);
            runInAction(() => {
                this._currentUser = user;
            });
            return true;
        });
        return result ?? false;
    }

    async logout(): Promise<void> {
        await withLoading(this, '_isLoading', '_errorMessage', async () => {
            await this.authUseCase.logout(this.isGuest);
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
            const user = await this.authUseCase.checkAuthState();
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

    async continueAsGuest(): Promise<void> {
        await withLoading(this, '_isLoading', '_errorMessage', async () => {
            const user = await this.authUseCase.continueAsGuest();
            runInAction(() => {
                this._currentUser = user;
            });
        });
    }

    async deleteAccount(): Promise<void> {
        // rethrow=true so callers can react to the failure
        await withLoading(this, '_isLoading', '_errorMessage', async () => {
            await this.authUseCase.deleteAccount();
            runInAction(() => {
                this._currentUser = null;
            });
        }, true);
    }

    async resetPassword(email: string): Promise<boolean> {
        const result = await withLoading(this, '_isLoading', '_errorMessage', async () => {
            await this.authUseCase.resetPassword(email);
            return true;
        });
        return result ?? false;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
