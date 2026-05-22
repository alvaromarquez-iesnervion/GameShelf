import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { ISettingsRepository } from '../../domain/interfaces/repositories/ISettingsRepository';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';
import { TYPES } from '../../di/types';

/**
 * ISettingsRepository implementation that persists user settings through
 * the GameShelfApi backend via IGameShelfApiClient.
 */
@injectable()
export class SettingsRepositoryImpl implements ISettingsRepository {

    constructor(
        @inject(TYPES.IGameShelfApiClient) private api: IGameShelfApiClient,
    ) {}

    async getCountry(): Promise<string | null> {
        return this.api.getSavedCountry();
    }

    async setCountry(code: string): Promise<void> {
        await this.api.setSavedCountry(code);
    }
}
