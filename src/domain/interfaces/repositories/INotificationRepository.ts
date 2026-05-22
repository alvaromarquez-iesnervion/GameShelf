import { NotificationPreferences } from '../../entities/NotificationPreferences';

export interface INotificationRepository {
    /** Reads users/{userId}/settings/notifications from Firestore. */
    getNotificationPreferences(userId: string): Promise<NotificationPreferences>;
    /** Updates users/{userId}/settings/notifications in Firestore. */
    updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
}
