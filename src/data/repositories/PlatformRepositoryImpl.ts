import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    Firestore,
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    getDocs,
    collection,
    writeBatch,
} from 'firebase/firestore';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';

// Mapa de enum a nombre de documento en Firestore (solo plataformas vinculables)
const PLATFORM_DOC_ID: Record<Exclude<Platform, Platform.UNKNOWN>, string> = {
    [Platform.STEAM]: 'steam',
    [Platform.EPIC_GAMES]: 'epic_games',
};

@injectable()
export class PlatformRepositoryImpl implements IPlatformRepository {

    constructor(
        @inject(TYPES.Firestore) private firestore: Firestore,
    ) {}

    async linkSteamPlatform(userId: string, steamId: string): Promise<LinkedPlatform> {
        const linkedAt = new Date();
        await setDoc(
            doc(this.firestore, 'users', userId, 'platforms', 'steam'),
            {
                externalUserId: steamId,
                linkedAt: linkedAt.toISOString(),
            },
        );
        return new LinkedPlatform(Platform.STEAM, steamId, linkedAt);
    }

    async linkEpicPlatform(userId: string, epicAccountId?: string): Promise<LinkedPlatform> {
        const linkedAt = new Date();
        const externalUserId = epicAccountId ?? 'imported';
        await setDoc(
            doc(this.firestore, 'users', userId, 'platforms', 'epic_games'),
            {
                externalUserId,
                linkedAt: linkedAt.toISOString(),
            },
        );
        return new LinkedPlatform(Platform.EPIC_GAMES, externalUserId, linkedAt);
    }

    async unlinkPlatform(userId: string, platform: Platform): Promise<void> {
        if (platform === Platform.UNKNOWN) return;
        const docId = PLATFORM_DOC_ID[platform as Exclude<Platform, Platform.UNKNOWN>];

        // 1. Eliminar vinculación de plataforma
        await deleteDoc(doc(this.firestore, 'users', userId, 'platforms', docId));

        // 2. Eliminar juegos de esa plataforma de la biblioteca usando writeBatch
        // (atómico y eficiente — Firestore admite hasta 500 ops por batch)
        const librarySnap = await getDocs(
            collection(this.firestore, 'users', userId, 'library'),
        );
        const toDelete = librarySnap.docs.filter(
            d => d.data().platform === platform,
        );

        // Procesar en lotes de 500 (límite de Firestore por batch)
        const BATCH_LIMIT = 500;
        for (let i = 0; i < toDelete.length; i += BATCH_LIMIT) {
            const batch = writeBatch(this.firestore);
            toDelete.slice(i, i + BATCH_LIMIT).forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        const snap = await getDocs(
            collection(this.firestore, 'users', userId, 'platforms'),
        );

        return snap.docs.map(d => {
            const data = d.data();
            // El docId ('steam' | 'epic_games') mapea al enum
            const platform = Object.entries(PLATFORM_DOC_ID).find(
                ([, docId]) => docId === d.id,
            )?.[0] as Platform | undefined;

            return new LinkedPlatform(
                platform ?? Platform.STEAM,
                data.externalUserId ?? '',
                data.linkedAt ? new Date(data.linkedAt) : new Date(),
            );
        });
    }
}
