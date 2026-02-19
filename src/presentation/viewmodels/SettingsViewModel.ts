import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { ISettingsUseCase } from '../../domain/interfaces/usecases/settings/ISettingsUseCase';
import { UserProfileDTO } from '../../domain/dtos/UserProfileDTO';
import { NotificationPreferences } from '../../domain/entities/NotificationPreferences';
import { TYPES } from '../../di/types';

/**
 * ViewModel para ajustes y perfil.
 * 
 * Transient: solo activo durante la pantalla de ajustes.
 */
@injectable()
export class SettingsViewModel {
    private _profile: UserProfileDTO | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.ISettingsUseCase)
        private readonly settingsUseCase: ISettingsUseCase,
    ) {
        makeAutoObservable(this);
    }

    get profile(): UserProfileDTO | null {
        return this._profile;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    get isDealsEnabled(): boolean {
        return this._profile?.notificationPreferences.getDealsEnabled() ?? false;
    }

    async loadProfile(userId: string): Promise<void> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            const profile = await this.settingsUseCase.getProfile(userId);
            runInAction(() => {
                this._profile = profile;
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

    async updateNotificationPreferences(
        userId: string,
        enabled: boolean,
    ): Promise<boolean> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            const preferences = new NotificationPreferences(enabled);
            await this.settingsUseCase.updateNotificationPreferences(userId, preferences);
            
            // Actualizar el perfil local
            if (this._profile) {
                runInAction(() => {
                    this._profile = new UserProfileDTO(
                        this._profile!.user,
                        this._profile!.linkedPlatforms,
                        preferences,
                    );
                });
            }
            
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

    async deleteAccount(): Promise<boolean> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            await this.settingsUseCase.deleteAccount();
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
