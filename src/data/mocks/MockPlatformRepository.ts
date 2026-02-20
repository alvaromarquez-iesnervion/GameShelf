import 'reflect-metadata';
import { injectable } from 'inversify';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { simulateDelay } from './MockDataProvider';

/**
 * Mock de IPlatformRepository con estado en memoria.
 *
 * Estado inicial: sin plataformas vinculadas.
 * El usuario debe pasar por el flujo de vinculación como en producción.
 * linkSteam/linkEpic añaden la plataforma; unlinkPlatform la elimina.
 */
@injectable()
export class MockPlatformRepository implements IPlatformRepository {

    private platforms: LinkedPlatform[] = [];

    async linkSteamPlatform(_userId: string, steamId: string): Promise<LinkedPlatform> {
        await simulateDelay(600);
        const linked = new LinkedPlatform(Platform.STEAM, steamId, new Date());
        this.platforms = this.platforms.filter(p => p.getPlatform() !== Platform.STEAM);
        this.platforms.push(linked);
        return linked;
    }

    async linkEpicPlatform(_userId: string, epicAccountId?: string): Promise<LinkedPlatform> {
        await simulateDelay(600);
        const externalId = epicAccountId ?? 'imported';
        const linked = new LinkedPlatform(Platform.EPIC_GAMES, externalId, new Date());
        this.platforms = this.platforms.filter(p => p.getPlatform() !== Platform.EPIC_GAMES);
        this.platforms.push(linked);
        return linked;
    }

    async unlinkPlatform(_userId: string, platform: Platform): Promise<void> {
        await simulateDelay(500);
        this.platforms = this.platforms.filter(p => p.getPlatform() !== platform);
    }

    async getLinkedPlatforms(_userId: string): Promise<LinkedPlatform[]> {
        await simulateDelay(300);
        return [...this.platforms];
    }
}
