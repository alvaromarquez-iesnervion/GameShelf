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
} from 'firebase/firestore';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';

// Mapa de enum a nombre de documento en Firestore
const PLATFORM_DOC_ID: Record<Platform, string> = {
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
        const docId = PLATFORM_DOC_ID[platform];

        // 1. Eliminar vinculación
        await deleteDoc(doc(this.firestore, 'users', userId, 'platforms', docId));

        // 2. Eliminar juegos de esa plataforma de la biblioteca
        const librarySnap = await getDocs(
            collection(this.firestore, 'users', userId, 'library'),
        );
        for (const gameDoc of librarySnap.docs) {
            if (gameDoc.data().platform === platform) {
                await deleteDoc(gameDoc.ref);
            }
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
