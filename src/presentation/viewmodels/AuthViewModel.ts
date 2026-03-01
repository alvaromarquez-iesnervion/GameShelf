import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IAuthRepository } from '../../domain/interfaces/repositories/IAuthRepository';
import { IGuestSessionRepository } from '../../domain/interfaces/repositories/IGuestSessionRepository';
import { User } from '../../domain/entities/User';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';
import { isGuestUser } from '../../core/utils/guestUtils';

/**
 * ViewModel para autenticación.
 *
 * Singleton: estado de auth global compartido en toda la app.
 * Depende directamente de IAuthRepository (sin use case intermedio).
 * Para sesiones de invitado, delega en IGuestSessionRepository (AsyncStorage).
 */
@injectable()
export class AuthViewModel {
    private _currentUser: User | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.IAuthRepository)
        private readonly authRepository: IAuthRepository,
        @inject(TYPES.IGuestSessionRepository)
        private readonly guestSessionRepository: IGuestSessionRepository,
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
            const user = await this.authRepository.login(email, password);
            // Limpiar sesión de invitado obsoleta si existía
            await this.guestSessionRepository.clearGuestSession();
            runInAction(() => {
                this._currentUser = user;
            });
            return true;
        });
        return result ?? false;
    }

    async register(email: string, password: string): Promise<boolean> {
        const result = await withLoading(this, '_isLoading', '_errorMessage', async () => {
            const user = await this.authRepository.register(email, password);
            // Limpiar sesión de invitado obsoleta si existía
            await this.guestSessionRepository.clearGuestSession();
            runInAction(() => {
                this._currentUser = user;
            });
            return true;
        });
        return result ?? false;
    }

    async logout(): Promise<void> {
        await withLoading(this, '_isLoading', '_errorMessage', async () => {
            if (this.isGuest) {
                await this.guestSessionRepository.clearGuestSession();
            } else {
                await this.authRepository.logout();
            }
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
            if (user) {
                runInAction(() => {
                    this._currentUser = user;
                });
                return;
            }
            // Firebase no tiene sesión — comprobar si hay sesión de invitado en local
            const guestId = await this.guestSessionRepository.loadGuestId();
            if (guestId) {
                runInAction(() => {
                    this._currentUser = new User(guestId, '', 'Invitado', new Date());
                });
            } else {
                runInAction(() => {
                    this._currentUser = null;
                });
            }
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
            const guestId = await this.guestSessionRepository.getOrCreateGuestId();
            runInAction(() => {
                this._currentUser = new User(guestId, '', 'Invitado', new Date());
            });
        });
    }

    async deleteAccount(): Promise<void> {
        // rethrow=true so callers can react to the failure
        await withLoading(this, '_isLoading', '_errorMessage', async () => {
            await this.authRepository.deleteAccount();
            runInAction(() => {
                this._currentUser = null;
            });
        }, true);
    }

    async resetPassword(email: string): Promise<boolean> {
        const result = await withLoading(this, '_isLoading', '_errorMessage', async () => {
            await this.authRepository.resetPassword(email);
            return true;
        });
        return result ?? false;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
