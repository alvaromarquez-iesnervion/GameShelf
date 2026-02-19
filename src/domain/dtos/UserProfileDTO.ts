import { User } from '../entities/User';
import { LinkedPlatform } from '../entities/LinkedPlatform';
import { NotificationPreferences } from '../entities/NotificationPreferences';

/**
 * Agrega datos de 3 repositorios (Auth, Platform, Notification).
 * Producido por SettingsUseCase.getProfile().
 */
export class UserProfileDTO {
    readonly user: User;
    readonly linkedPlatforms: LinkedPlatform[];
    readonly notificationPreferences: NotificationPreferences;

    constructor(
        user: User,
        linkedPlatforms: LinkedPlatform[],
        notificationPreferences: NotificationPreferences,
    ) {
        this.user = user;
        this.linkedPlatforms = linkedPlatforms;
        this.notificationPreferences = notificationPreferences;
    }
}
