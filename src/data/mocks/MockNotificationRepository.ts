import 'reflect-metadata';
import { injectable } from 'inversify';
import { INotificationRepository } from '../../domain/interfaces/repositories/INotificationRepository';
import { NotificationPreferences } from '../../domain/entities/NotificationPreferences';
import { MOCK_NOTIFICATION_PREFERENCES, simulateDelay } from './MockDataProvider';

/**
 * Mock de INotificationRepository con estado en memoria.
 *
 * Estado inicial: notificaciones de ofertas activadas (dealsEnabled: true).
 * updateNotificationPreferences persiste el cambio en memoria durante la sesión.
 */
@injectable()
export class MockNotificationRepository implements INotificationRepository {

    private preferences = new NotificationPreferences(
        MOCK_NOTIFICATION_PREFERENCES.getDealsEnabled(),
    );

    async getNotificationPreferences(_userId: string): Promise<NotificationPreferences> {
        await simulateDelay(200);
        return new NotificationPreferences(this.preferences.getDealsEnabled());
    }

    async updateNotificationPreferences(
        _userId: string,
        preferences: NotificationPreferences,
    ): Promise<void> {
        await simulateDelay(300);
        this.preferences.setDealsEnabled(preferences.getDealsEnabled());
    }
}
