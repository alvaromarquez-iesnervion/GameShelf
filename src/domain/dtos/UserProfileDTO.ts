import { User } from '../entities/User';
import { LinkedPlatform } from '../entities/LinkedPlatform';
import { NotificationPreferences } from '../entities/NotificationPreferences';

/**
 * Agrega datos de 3 repositorios (Auth, Platform, Notification).
 * Producido por SettingsUseCase.getProfile().
 */
export interface UserProfileDTO {
    readonly user: User;
    readonly linkedPlatforms: LinkedPlatform[];
    readonly notificationPreferences: NotificationPreferences;
}
