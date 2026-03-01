import 'reflect-metadata';
import { injectable } from 'inversify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { GogAuthToken } from '../../domain/dtos/GogAuthToken';
import { GUEST_KEY_PLATFORMS } from '../../core/utils/guestUtils';

interface StoredPlatform {
    platform: Platform;
    externalUserId: string;
    linkedAt: string; // ISO string
}

@injectable()
export class LocalPlatformRepository implements IPlatformRepository {

    private async readAll(): Promise<LinkedPlatform[]> {
        const raw = await AsyncStorage.getItem(GUEST_KEY_PLATFORMS);
        if (!raw) return [];
        const parsed: StoredPlatform[] = JSON.parse(raw);
        return parsed.map(p => new LinkedPlatform(p.platform, p.externalUserId, new Date(p.linkedAt)));
    }

    private async writeAll(platforms: LinkedPlatform[]): Promise<void> {
        const serialized: StoredPlatform[] = platforms.map(p => ({
            platform: p.getPlatform(),
            externalUserId: p.getExternalUserId(),
            linkedAt: p.getLinkedAt().toISOString(),
        }));
        await AsyncStorage.setItem(GUEST_KEY_PLATFORMS, JSON.stringify(serialized));
    }

    async linkSteamPlatform(_userId: string, steamId: string): Promise<LinkedPlatform> {
        const linked = new LinkedPlatform(Platform.STEAM, steamId, new Date());
        const current = await this.readAll();
        const filtered = current.filter(p => p.getPlatform() !== Platform.STEAM);
        await this.writeAll([...filtered, linked]);
        return linked;
    }

    async linkEpicPlatform(_userId: string, epicAccountId?: string): Promise<LinkedPlatform> {
        const linked = new LinkedPlatform(Platform.EPIC_GAMES, epicAccountId ?? 'imported', new Date());
        const current = await this.readAll();
        const filtered = current.filter(p => p.getPlatform() !== Platform.EPIC_GAMES);
        await this.writeAll([...filtered, linked]);
        return linked;
    }

    async linkGogPlatform(_userId: string, gogUserId: string, _tokens: GogAuthToken): Promise<LinkedPlatform> {
        const linked = new LinkedPlatform(Platform.GOG, gogUserId, new Date());
        const current = await this.readAll();
        const filtered = current.filter(p => p.getPlatform() !== Platform.GOG);
        await this.writeAll([...filtered, linked]);
        return linked;
    }

    async unlinkPlatform(_userId: string, platform: Platform): Promise<void> {
        const current = await this.readAll();
        await this.writeAll(current.filter(p => p.getPlatform() !== platform));
    }

    async getLinkedPlatforms(_userId: string): Promise<LinkedPlatform[]> {
        return this.readAll();
    }
}
