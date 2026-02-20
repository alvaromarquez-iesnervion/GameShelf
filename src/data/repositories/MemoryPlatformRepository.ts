import 'reflect-metadata';
import { injectable } from 'inversify';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';

const TEST_STEAM_ID = '76561198130408689';
const TEST_USER_ID = 'mock-uid-dev-001';

/**
 * Implementación en memoria de IPlatformRepository.
 *
 * Para testing: Steam ya vinculado con el SteamID de testing.
 *
 * Se usa mientras Firebase no está configurado, pero Steam API sí está activa.
 * Los datos se pierden al cerrar la app.
 */
@injectable()
export class MemoryPlatformRepository implements IPlatformRepository {

    private readonly platformsByUser: Map<string, LinkedPlatform[]>;

    constructor() {
        this.platformsByUser = new Map([
            [TEST_USER_ID, [
                new LinkedPlatform(Platform.STEAM, TEST_STEAM_ID, new Date()),
            ]],
        ]);
    }

    async linkSteamPlatform(userId: string, steamId: string): Promise<LinkedPlatform> {
        const linked = new LinkedPlatform(Platform.STEAM, steamId, new Date());
        this.upsert(userId, linked);
        return linked;
    }

    async linkEpicPlatform(userId: string, epicAccountId?: string): Promise<LinkedPlatform> {
        const externalId = epicAccountId ?? 'imported';
        const linked = new LinkedPlatform(Platform.EPIC_GAMES, externalId, new Date());
        this.upsert(userId, linked);
        return linked;
    }

    async unlinkPlatform(userId: string, platform: Platform): Promise<void> {
        const current = this.platformsByUser.get(userId) ?? [];
        this.platformsByUser.set(
            userId,
            current.filter(p => p.getPlatform() !== platform),
        );
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        return [...(this.platformsByUser.get(userId) ?? [])];
    }

    private upsert(userId: string, platform: LinkedPlatform): void {
        const current = this.platformsByUser.get(userId) ?? [];
        const filtered = current.filter(p => p.getPlatform() !== platform.getPlatform());
        this.platformsByUser.set(userId, [...filtered, platform]);
    }
}
