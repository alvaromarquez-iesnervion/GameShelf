import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    Firestore,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    collection,
    writeBatch,
    query,
    where,
} from 'firebase/firestore';
import { IPlatformRepository } from '../../domain/interfaces/repositories/IPlatformRepository';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { Platform } from '../../domain/enums/Platform';
import { GogAuthToken } from '../../domain/dtos/GogAuthToken';
import { EpicAuthToken } from '../../domain/dtos/EpicAuthToken';
import { saveGogTokens, clearGogTokens } from '../utils/GogTokenStore';
import { saveEpicTokens, clearEpicTokens } from '../utils/EpicTokenStore';
import { TYPES } from '../../di/types';

// Mapa de enum a nombre de documento en Firestore (solo plataformas vinculables)
const PLATFORM_DOC_ID: Record<Exclude<Platform, Platform.UNKNOWN>, string> = {
    [Platform.STEAM]: 'steam',
    [Platform.EPIC_GAMES]: 'epic_games',
    [Platform.GOG]: 'gog',
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

    async linkEpicPlatform(userId: string, epicAccountId?: string, token?: EpicAuthToken): Promise<LinkedPlatform> {
        const linkedAt = new Date();
        const externalUserId = epicAccountId ?? 'imported';

        // Los tokens OAuth se guardan en SecureStore (Keychain/Keystore), nunca en Firestore.
        const writes: Promise<unknown>[] = [
            setDoc(
                doc(this.firestore, 'users', userId, 'platforms', 'epic_games'),
                {
                    externalUserId,
                    linkedAt: linkedAt.toISOString(),
                },
            ),
        ];
        if (token) {
            writes.push(saveEpicTokens(token));
        }
        await Promise.all(writes);

        return new LinkedPlatform(Platform.EPIC_GAMES, externalUserId, linkedAt);
    }

    async linkGogPlatform(userId: string, gogUserId: string, tokens: GogAuthToken): Promise<LinkedPlatform> {
        const linkedAt = new Date();

        // Los tokens OAuth se guardan en SecureStore (Keychain/Keystore), nunca en Firestore.
        // En Firestore solo persiste el ID de usuario de GOG para mostrar el estado de vinculación.
        await Promise.all([
            saveGogTokens(tokens),
            setDoc(
                doc(this.firestore, 'users', userId, 'platforms', 'gog'),
                {
                    externalUserId: gogUserId,
                    linkedAt: linkedAt.toISOString(),
                },
            ),
        ]);

        return new LinkedPlatform(Platform.GOG, gogUserId, linkedAt);
    }

    async unlinkPlatform(userId: string, platform: Platform): Promise<void> {
        if (platform === Platform.UNKNOWN) return;
        const docId = PLATFORM_DOC_ID[platform as Exclude<Platform, Platform.UNKNOWN>];

        // 1. Limpiar tokens de SecureStore primero (antes de cualquier operación Firestore)
        if (platform === Platform.GOG) {
            await clearGogTokens();
        } else if (platform === Platform.EPIC_GAMES) {
            await clearEpicTokens();
        }

        // 2. Batch-delete juegos de esta plataforma usando where() para evitar leer toda la biblioteca
        const librarySnap = await getDocs(
            query(
                collection(this.firestore, 'users', userId, 'library'),
                where('platform', '==', platform),
            ),
        );

        // Procesar en lotes de 500 (límite de Firestore por batch)
        const BATCH_LIMIT = 500;
        for (let i = 0; i < librarySnap.docs.length; i += BATCH_LIMIT) {
            const batch = writeBatch(this.firestore);
            librarySnap.docs.slice(i, i + BATCH_LIMIT).forEach(d => batch.delete(d.ref));
            await batch.commit();
        }

        // 3. Eliminar vinculación de plataforma (después de eliminar los juegos)
        await deleteDoc(doc(this.firestore, 'users', userId, 'platforms', docId));
    }

    async getLinkedPlatforms(userId: string): Promise<LinkedPlatform[]> {
        const snap = await getDocs(
            collection(this.firestore, 'users', userId, 'platforms'),
        );

        return snap.docs.flatMap(d => {
            const data = d.data();
            // El docId ('steam' | 'epic_games' | 'gog') mapea al enum
            const platform = Object.entries(PLATFORM_DOC_ID).find(
                ([, docId]) => docId === d.id,
            )?.[0] as Platform | undefined;

            // Omitir documentos con ID desconocido para evitar un fallback incorrecto
            if (!platform) return [];

            return [new LinkedPlatform(
                platform,
                data.externalUserId ?? '',
                data.linkedAt ? new Date(data.linkedAt) : new Date(),
            )];
        });
    }
}
