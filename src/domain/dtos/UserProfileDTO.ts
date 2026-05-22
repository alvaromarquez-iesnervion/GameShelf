import { User } from '../entities/User';
import { LinkedPlatform } from '../entities/LinkedPlatform';
import { NotificationPreferences } from '../entities/NotificationPreferences';

/**
 * Aggregates data from 3 repositories (Auth, Platform, Notification).
 * Produced by SettingsUseCase.getProfile().
 */
export interface UserProfileDTO {
    readonly user: User;
    readonly linkedPlatforms: LinkedPlatform[];
    readonly notificationPreferences: NotificationPreferences;
}
