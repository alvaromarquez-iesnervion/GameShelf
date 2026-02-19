import 'reflect-metadata';
import { injectable } from 'inversify';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';

/**
 * Implementación en memoria de IPlatformRepository.
 *
 * Se usa mientras Firebase no está configurado, pero Steam API sí está activa.
 * Los datos se pierden al cerrar la app.
 *
 * TODO: reemplazar por PlatformRepositoryImpl (Firestore) cuando Firebase esté listo.
 *       Ver src/data/repositories/PlatformRepositoryImpl.ts — implementación completa.
 */
@injectable()
export class MemoryPlatformRepository implements IPlatformRepository {

    // Mapa: userId → plataformas vinculadas
    private readonly platformsByUser = new Map<string, LinkedPlatform[]>();

    async linkSteamPlatform(userId: string, steamId: string): Promise<LinkedPlatform> {
        const linked = new LinkedPlatform(Platform.STEAM, steamId, new Date());
        this.upsert(userId, linked);
        return linked;
    }

    async linkEpicPlatform(userId: string): Promise<LinkedPlatform> {
        const linked = new LinkedPlatform(Platform.EPIC_GAMES, 'imported', new Date());
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

    // ─── helpers ─────────────────────────────────────────────────────────────

    private upsert(userId: string, platform: LinkedPlatform): void {
        const current = this.platformsByUser.get(userId) ?? [];
        const filtered = current.filter(p => p.getPlatform() !== platform.getPlatform());
        this.platformsByUser.set(userId, [...filtered, platform]);
    }
}
