import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { ISettingsUseCase } from '../../domain/interfaces/usecases/settings/ISettingsUseCase';
import { UserProfileDTO } from '../../domain/dtos/UserProfileDTO';
import { NotificationPreferences } from '../../domain/entities/NotificationPreferences';
import { TYPES } from '../../di/types';
import { BaseViewModel } from './BaseViewModel';

/**
 * ViewModel para ajustes y perfil.
 * 
 * Transient: solo activo durante la pantalla de ajustes.
 */
@injectable()
export class SettingsViewModel extends BaseViewModel {
    private _profile: UserProfileDTO | null = null;
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;

    constructor(
        @inject(TYPES.ISettingsUseCase)
        private readonly settingsUseCase: ISettingsUseCase,
    ) {
        super();
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
        await this.withLoading('_isLoading', '_errorMessage', async () => {
            const profile = await this.settingsUseCase.getProfile(userId);
            runInAction(() => {
                this._profile = profile;
            });
        });
    }

    async updateNotificationPreferences(
        userId: string,
        enabled: boolean,
    ): Promise<boolean> {
        const result = await this.withLoading('_isLoading', '_errorMessage', async () => {
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
        });
        return result ?? false;
    }

    async deleteAccount(): Promise<boolean> {
        const result = await this.withLoading('_isLoading', '_errorMessage', async () => {
            await this.settingsUseCase.deleteAccount();
            return true;
        });
        return result ?? false;
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
