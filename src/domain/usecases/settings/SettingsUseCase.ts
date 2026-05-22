import { ISettingsUseCase } from '../../interfaces/usecases/settings/ISettingsUseCase';
import { IAuthRepository } from '../../interfaces/repositories/IAuthRepository';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { INotificationRepository } from '../../interfaces/repositories/INotificationRepository';
import { NotificationPreferences } from '../../entities/NotificationPreferences';
import { UserProfileDTO } from '../../dtos/UserProfileDTO';

/**
 * Aggregates the data needed for the settings screen.
 *
 * getProfile runs the 3 reads in parallel (User, platforms, notifications)
 * and packages them into a UserProfileDTO.
 *
 * deleteAccount: irreversible deletion. Removes Firestore subcollections,
 * the user document, and the Firebase Auth account.
 */
export class SettingsUseCase implements ISettingsUseCase {

    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly platformRepository: IPlatformRepository,
        private readonly notificationRepository: INotificationRepository,
    ) {}

    async getProfile(userId: string): Promise<UserProfileDTO> {
        const [user, linkedPlatforms, notificationPreferences] = await Promise.all([
            this.authRepository.getCurrentUser(),
            this.platformRepository.getLinkedPlatforms(userId),
            this.notificationRepository.getNotificationPreferences(userId),
        ]);

        if (!user) {
            throw new Error('No hay sesión activa. Por favor, inicia sesión.');
        }

        return { user, linkedPlatforms, notificationPreferences };
    }

    async updateNotificationPreferences(
        userId: string,
        preferences: NotificationPreferences,
    ): Promise<void> {
        return this.notificationRepository.updateNotificationPreferences(userId, preferences);
    }
}
