import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';
import { isGuestUser } from '../../core/utils/guestUtils';

@injectable()
export class GuestAwarePlatformRepository implements IPlatformRepository {

    constructor(
        @inject(TYPES.FirestorePlatformRepository)
        private readonly firestoreRepo: IPlatformRepository,
        @inject(TYPES.LocalPlatformRepository)
        private readonly localRepo: IPlatformRepository,
    ) {}

    private repo(userId: string): IPlatformRepository {
        return isGuestUser(userId) ? this.localRepo : this.firestoreRepo;
    }

    linkSteamPlatform(userId: string, steamId: string): Promise<LinkedPlatform> {
        return this.repo(userId).linkSteamPlatform(userId, steamId);
    }

    linkEpicPlatform(userId: string, epicAccountId?: string): Promise<LinkedPlatform> {
        return this.repo(userId).linkEpicPlatform(userId, epicAccountId);
    }

    unlinkPlatform(userId: string, platform: Platform): Promise<void> {
        return this.repo(userId).unlinkPlatform(userId, platform);
    }

    getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        return this.repo(userId).getLinkedPlatforms(userId);
    }
}
