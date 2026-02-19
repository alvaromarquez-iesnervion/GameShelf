import { NotificationPreferences } from '../../entities/NotificationPreferences';

export interface INotificationRepository {
    /** Lee users/{userId}/settings/notifications de Firestore. */
    getNotificationPreferences(userId: string): Promise<NotificationPreferences>;
    /** Actualiza users/{userId}/settings/notifications en Firestore. */
    updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
}
