import { UserProfileDTO } from '../../../dtos/UserProfileDTO';
import { NotificationPreferences } from '../../../entities/NotificationPreferences';

export interface ISettingsUseCase {
    /**
     * Agrega User + LinkedPlatform[] + NotificationPreferences en un UserProfileDTO.
     * Realiza las 3 lecturas en paralelo con Promise.all.
     */
    getProfile(userId: string): Promise<UserProfileDTO>;
    updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
    /** Elimina subcolecciones Firestore + documento + cuenta Firebase Auth. Irreversible. */
    deleteAccount(): Promise<void>;
}
