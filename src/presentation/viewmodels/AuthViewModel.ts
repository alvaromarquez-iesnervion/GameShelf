import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IAuthRepository } from '../../domain/interfaces/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';
import { TYPES } from '../../di/types';

/**
 * ViewModel para autenticación.
 * 
 * Singleton: estado de auth global compartido en toda la app.
 * Depende directamente de IAuthRepository (sin use case intermedio).
 */
@injectable()
export class AuthViewModel {
    private _currentUser: User | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.IAuthRepository)
        private readonly authRepository: IAuthRepository,
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

    async login(email: string, password: string): Promise<boolean> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            const user = await this.authRepository.login(email, password);
            runInAction(() => {
                this._currentUser = user;
            });
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    async register(email: string, password: string): Promise<boolean> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            const user = await this.authRepository.register(email, password);
            runInAction(() => {
                this._currentUser = user;
            });
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    async logout(): Promise<void> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            await this.authRepository.logout();
            runInAction(() => {
                this._currentUser = null;
            });
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    async checkAuthState(): Promise<void> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            const user = await this.authRepository.getCurrentUser();
            runInAction(() => {
                this._currentUser = user;
            });
        } catch (error) {
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
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            await this.authRepository.deleteAccount();
            runInAction(() => {
                this._currentUser = null;
            });
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            throw error;
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    async resetPassword(email: string): Promise<boolean> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            await this.authRepository.resetPassword(email);
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
