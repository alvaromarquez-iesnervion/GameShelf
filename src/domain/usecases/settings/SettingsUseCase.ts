import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { ISettingsUseCase } from '../../interfaces/usecases/settings/ISettingsUseCase';
import { IAuthRepository } from '../../interfaces/repositories/IAuthRepository';
import { IPlatformRepository } from '../../interfaces/repositories/IPlatformRepository';
import { INotificationRepository } from '../../interfaces/repositories/INotificationRepository';
import { NotificationPreferences } from '../../entities/NotificationPreferences';
import { UserProfileDTO } from '../../dtos/UserProfileDTO';
import { TYPES } from '../../../di/types';

/**
 * Agrega los datos necesarios para la pantalla de ajustes.
 *
 * getProfile ejecuta las 3 lecturas en paralelo (User, plataformas, notificaciones)
 * y las empaqueta en un UserProfileDTO.
 *
 * deleteAccount: eliminación irreversible. Elimina subcolecciones Firestore,
 * el documento del usuario y la cuenta Firebase Auth.
 */
@injectable()
export class SettingsUseCase implements ISettingsUseCase {

    constructor(
        @inject(TYPES.IAuthRepository)
        private readonly authRepository: IAuthRepository,
        @inject(TYPES.IPlatformRepository)
        private readonly platformRepository: IPlatformRepository,
        @inject(TYPES.INotificationRepository)
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

        return new UserProfileDTO(user, linkedPlatforms, notificationPreferences);
    }

    async updateNotificationPreferences(
        userId: string,
        preferences: NotificationPreferences,
    ): Promise<void> {
        return this.notificationRepository.updateNotificationPreferences(userId, preferences);
    }

    async deleteAccount(): Promise<void> {
        return this.authRepository.deleteAccount();
    }
}
