import { UserProfileDTO } from '../../../dtos/UserProfileDTO';
import { NotificationPreferences } from '../../../entities/NotificationPreferences';

export interface ISettingsUseCase {
    /**
     * Aggregates User + LinkedPlatform[] + NotificationPreferences into a UserProfileDTO.
     * Performs the 3 reads in parallel using Promise.all.
     */
    getProfile(userId: string): Promise<UserProfileDTO>;
    updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
}
