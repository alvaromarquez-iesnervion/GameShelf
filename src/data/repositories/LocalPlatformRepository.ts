import 'reflect-metadata';
import { injectable } from 'inversify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { GogAuthToken } from '../../domain/dtos/GogAuthToken';
import { EpicAuthToken } from '../../domain/dtos/EpicAuthToken';
import { PsnAuthToken } from '../../domain/dtos/PsnAuthToken';
import { GUEST_KEY_PLATFORMS } from '../../domain/utils/guestUtils';

const GUEST_KEY_GOG_TOKEN = '@gameshelf/guest_gog_token';

interface StoredPlatform {
    platform: Platform;
    externalUserId: string;
    linkedAt: string; // ISO string
}

@injectable()
export class LocalPlatformRepository implements IPlatformRepository {

    // Mutex: serializa las operaciones read-modify-write para evitar race conditions.
    private _queue: Promise<void> = Promise.resolve();

    private withMutex<T>(fn: () => Promise<T>): Promise<T> {
        let release!: () => void;
        const acquired = this._queue.then(() => fn());
        this._queue = acquired.then(
            () => { release?.(); },
            () => { release?.(); },
        );
        return acquired;
    }

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
        return this.withMutex(async () => {
            const linked = new LinkedPlatform(Platform.STEAM, steamId, new Date());
            const current = await this.readAll();
            const filtered = current.filter(p => p.getPlatform() !== Platform.STEAM);
            await this.writeAll([...filtered, linked]);
            return linked;
        });
    }

    async linkEpicPlatform(_userId: string, epicAccountId?: string, _token?: EpicAuthToken): Promise<LinkedPlatform> {
        return this.withMutex(async () => {
            const linked = new LinkedPlatform(Platform.EPIC_GAMES, epicAccountId ?? 'imported', new Date());
            const current = await this.readAll();
            const filtered = current.filter(p => p.getPlatform() !== Platform.EPIC_GAMES);
            await this.writeAll([...filtered, linked]);
            return linked;
        });
    }

    async linkGogPlatform(_userId: string, gogUserId: string, tokens: GogAuthToken): Promise<LinkedPlatform> {
        return this.withMutex(async () => {
            const linked = new LinkedPlatform(Platform.GOG, gogUserId, new Date());
            const current = await this.readAll();
            const filtered = current.filter(p => p.getPlatform() !== Platform.GOG);
            await this.writeAll([...filtered, linked]);
            await AsyncStorage.setItem(GUEST_KEY_GOG_TOKEN, JSON.stringify({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                expiresAt: tokens.expiresAt.toISOString(),
                userId: tokens.userId,
            }));
            return linked;
        });
    }

    async linkPsnPlatform(_userId: string, psnAccountId: string, _tokens: PsnAuthToken): Promise<LinkedPlatform> {
        return this.withMutex(async () => {
            const linked = new LinkedPlatform(Platform.PSN, psnAccountId, new Date());
            const current = await this.readAll();
            const filtered = current.filter(p => p.getPlatform() !== Platform.PSN);
            await this.writeAll([...filtered, linked]);
            return linked;
        });
    }

    async unlinkPlatform(_userId: string, platform: Platform): Promise<void> {
        return this.withMutex(async () => {
            const current = await this.readAll();
            await this.writeAll(current.filter(p => p.getPlatform() !== platform));
            if (platform === Platform.GOG) {
                await AsyncStorage.removeItem(GUEST_KEY_GOG_TOKEN);
            }
        });
    }

    async getGogToken(): Promise<GogAuthToken | null> {
        const raw = await AsyncStorage.getItem(GUEST_KEY_GOG_TOKEN);
        if (!raw) return null;
        const s = JSON.parse(raw);
        return new GogAuthToken(s.accessToken, s.refreshToken, new Date(s.expiresAt), s.userId);
    }

    async getLinkedPlatforms(_userId: string): Promise<LinkedPlatform[]> {
        return this.readAll();
    }
}
