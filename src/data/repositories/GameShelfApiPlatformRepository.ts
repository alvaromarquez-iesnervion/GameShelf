import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { GogAuthToken } from '../../domain/dtos/GogAuthToken';
import { EpicAuthToken } from '../../domain/dtos/EpicAuthToken';
import { PsnAuthToken } from '../../domain/dtos/PsnAuthToken';
import { TYPES } from '../../di/types';

/**
 * IPlatformRepository implementation that delegates to the GameShelfApi backend.
 *
 * Platform-linking methods (linkEpicPlatform, linkGogPlatform, linkPsnPlatform)
 * are not used in API mode: PlatformLinkUseCase calls IGameShelfApiClient directly
 * after Phase 3. They are kept only to satisfy the interface contract.
 */
@injectable()
export class GameShelfApiPlatformRepository implements IPlatformRepository {

    constructor(
        @inject(TYPES.IGameShelfApiClient) private api: IGameShelfApiClient,
    ) {}

    async getLinkedPlatforms(_userId: string): Promise<LinkedPlatform[]> {
        return this.api.getLinkedPlatforms();
    }

    async linkSteamPlatform(_userId: string, steamId: string): Promise<LinkedPlatform> {
        return this.api.linkSteamManual(steamId);
    }

    // Phase 3 rewrites PlatformLinkUseCase to call IGameShelfApiClient directly.
    // These methods are kept only to satisfy the interface contract.
    async linkEpicPlatform(_userId: string, _epicAccountId?: string, _token?: EpicAuthToken): Promise<LinkedPlatform> {
        throw new Error('linkEpicPlatform: use IGameShelfApiClient.linkWithCode() directly (Phase 3)');
    }

    async linkGogPlatform(_userId: string, _gogUserId: string, _tokens: GogAuthToken): Promise<LinkedPlatform> {
        throw new Error('linkGogPlatform: use IGameShelfApiClient.linkWithCode() directly (Phase 3)');
    }

    async linkPsnPlatform(_userId: string, _psnAccountId: string, _tokens: PsnAuthToken): Promise<LinkedPlatform> {
        throw new Error('linkPsnPlatform: use IGameShelfApiClient.linkWithNpsso() directly (Phase 3)');
    }

    async unlinkPlatform(_userId: string, platform: Platform): Promise<void> {
        return this.api.unlinkPlatform(platform);
    }
}
