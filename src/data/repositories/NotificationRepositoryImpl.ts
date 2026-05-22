import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { INotificationRepository } from '../../domain/interfaces/repositories/INotificationRepository';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';
import { NotificationPreferences } from '../../domain/entities/NotificationPreferences';
import { TYPES } from '../../di/types';

/**
 * INotificationRepository implementation that delegates to the GameShelfApi backend.
 *
 * _userId is accepted on every method to satisfy the interface contract but is
 * not forwarded — the API derives the user from the session token.
 */
@injectable()
export class NotificationRepositoryImpl implements INotificationRepository {

    constructor(
        @inject(TYPES.IGameShelfApiClient)
        private readonly apiClient: IGameShelfApiClient,
    ) {}

    async getNotificationPreferences(_userId: string): Promise<NotificationPreferences> {
        const data = await this.apiClient.getNotificationPreferences();
        return new NotificationPreferences(data.dealsEnabled);
    }

    async updateNotificationPreferences(
        _userId: string,
        preferences: NotificationPreferences,
    ): Promise<void> {
        await this.apiClient.updateNotificationPreferences(preferences.getDealsEnabled());
    }
}
