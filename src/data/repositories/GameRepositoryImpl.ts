import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    Firestore,
    collection,
    doc,
    getDoc,
    getDocs,
    writeBatch,
    updateDoc,
    query,
    orderBy,
    limit,
    startAfter,
    documentId,
} from 'firebase/firestore';
import { loadGogTokens, saveGogTokens } from '../utils/GogTokenStore';
import { loadEpicTokens, saveEpicTokens } from '../utils/EpicTokenStore';
import { loadPsnTokens, savePsnTokens } from '../utils/PsnTokenStore';
import { IGameRepository, LibraryPage } from '../../domain/interfaces/repositories/IGameRepository';
import { ISteamApiService } from '../../domain/interfaces/services/ISteamApiService';
import { IEpicGamesApiService } from '../../domain/interfaces/services/IEpicGamesApiService';
import { IGogApiService } from '../../domain/interfaces/services/IGogApiService';
import { IPsnApiService } from '../../domain/interfaces/services/IPsnApiService';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { GameType } from '../../domain/enums/GameType';
import { FirestoreGameMapper } from '../mappers/FirestoreGameMapper';
import { TYPES } from '../../di/types';

@injectable()
export class GameRepositoryImpl implements IGameRepository {

    constructor(
        @inject(TYPES.Firestore) private firestore: Firestore,
        @inject(TYPES.ISteamApiService) private steamApiService: ISteamApiService,
        @inject(TYPES.IEpicGamesApiService) private epicGamesApiService: IEpicGamesApiService,
        @inject(TYPES.IGogApiService) private gogApiService: IGogApiService,
        @inject(TYPES.IIsThereAnyDealService) private itadService: IIsThereAnyDealService,
        @inject(TYPES.IPsnApiService) private psnApiService: IPsnApiService,
    ) {}

    async getLibraryGames(userId: string): Promise<Game[]> {
        const snap = await getDocs(
            collection(this.firestore, 'users', userId, 'library'),
        );
        return snap.docs.map(d => FirestoreGameMapper.toDomain(d.id, d.data()));
    }

    async getLibraryGamesPage(userId: string, pageSize: number, cursor?: string): Promise<LibraryPage> {
        const colRef = collection(this.firestore, 'users', userId, 'library');
        const q = cursor
            ? query(colRef, orderBy(documentId()), limit(pageSize), startAfter(cursor))
            : query(colRef, orderBy(documentId()), limit(pageSize));

        const snap = await getDocs(q);
        const games = snap.docs.map(d => FirestoreGameMapper.toDomain(d.id, d.data()));
        const lastDoc = snap.docs[snap.docs.length - 1];

        return {
            games,
            nextCursor: snap.docs.length === pageSize ? (lastDoc?.id ?? null) : null,
        };
    }

    async getGameById(userId: string, gameId: string): Promise<Game> {
        const snap = await getDoc(
            doc(this.firestore, 'users', userId, 'library', gameId),
        );
        if (!snap.exists()) {
            throw new Error(`Juego ${gameId} no encontrado en la biblioteca de ${userId}`);
        }
        return FirestoreGameMapper.toDomain(snap.id, snap.data());
    }

    async getOrCreateGameById(userId: string, gameId: string, steamAppId?: number | null): Promise<Game> {
        // 1a. Buscar en la biblioteca del usuario por gameId directo (juego ya sincronizado)
        try {
            return await this.getGameById(userId, gameId);
        } catch { /* no está por ese id — continuar */ }

        // 1b. Si viene steamAppId, buscar en la biblioteca por ese ID
        //     (los juegos Steam se guardan con el steamAppId como documento ID)
        if (steamAppId != null) {
            try {
                return await this.getGameById(userId, String(steamAppId));
            } catch { /* tampoco — continuar */ }
        }

        // 2. Si el gameId parece un steamAppId numérico, buscar también por ese valor
        const looksLikeSteamAppId = /^\d+$/.test(gameId);
        if (looksLikeSteamAppId) {
            const resolvedSteamAppId = steamAppId ?? parseInt(gameId, 10);

            const itadId = await this.itadService.lookupGameIdBySteamAppId(gameId);
            const info = itadId ? await this.itadService.getGameInfo(itadId) : null;

            return new Game(
                gameId,
                info?.title ?? '',
                '',
                info?.coverUrl ?? '',
                Platform.UNKNOWN,
                resolvedSteamAppId,
                itadId ?? null,
                0,
                null,
            );
        }

        // 3. El gameId es un ITAD UUID — buscar también por steamAppId si la info lo devuelve
        const info = await this.itadService.getGameInfo(gameId);
        if (!info) {
            throw new Error(`No se pudo obtener información del juego "${gameId}".`);
        }

        const resolvedSteamAppId = info.steamAppId ?? steamAppId ?? null;

        // 3b. Si ITAD nos da el steamAppId, intentar buscar en la biblioteca una última vez
        if (resolvedSteamAppId != null) {
            try {
                return await this.getGameById(userId, String(resolvedSteamAppId));
            } catch { /* no en biblioteca */ }
        }

        return new Game(
            gameId,
            info.title,
            '',
            info.coverUrl,
            Platform.UNKNOWN,
            resolvedSteamAppId,
            gameId,
            0,
            null,
        );
    }

    async syncLibrary(userId: string, platform: Platform): Promise<Game[]> {
        let games: Game[] = [];

        if (platform === Platform.STEAM) {
            // SteamID se obtiene de Firestore (plataforma vinculada)
            const steamDoc = await getDoc(
                doc(this.firestore, 'users', userId, 'platforms', 'steam'),
            );
            if (!steamDoc.exists()) return [];
            const steamId = steamDoc.data().externalUserId as string;
            games = await this.steamApiService.getUserGames(steamId);

        } else if (platform === Platform.EPIC_GAMES) {
            // Si hay token almacenado (flujo auth code), re-sincronizar desde la API de Epic.
            // Si no (flujo GDPR), devolver los juegos ya almacenados en Firestore.
            const stored = await loadEpicTokens();
            if (!stored || !stored.refreshToken) {
                const allGames = await this.getLibraryGames(userId);
                return allGames.filter(g => g.getPlatform() === Platform.EPIC_GAMES);
            }

            let accessToken = stored.accessToken;
            if (stored.isExpired()) {
                const renewed = await this.epicGamesApiService.refreshToken(stored.refreshToken);
                accessToken = renewed.accessToken;
                await saveEpicTokens(renewed);
            }

            games = await this.epicGamesApiService.fetchLibrary(accessToken, stored.accountId);
        } else if (platform === Platform.GOG) {
            // 1. Leer tokens desde SecureStore del dispositivo
            const stored = await loadGogTokens();
            if (!stored) return [];

            let accessToken = stored.accessToken;

            // 2. Renovar token si ha expirado (con margen de 60 s)
            if (stored.expiresAt.getTime() - Date.now() < 60_000) {
                const renewed = await this.gogApiService.refreshToken(stored.refreshToken);
                accessToken = renewed.accessToken;
                await saveGogTokens(renewed);
            }

            // 3. Obtener biblioteca de GOG
            games = await this.gogApiService.getUserGames(accessToken);
        } else if (platform === Platform.PSN) {
            // 1. Leer tokens desde SecureStore del dispositivo
            const stored = await loadPsnTokens();
            if (!stored) return [];

            let accessToken = stored.accessToken;

            // 2. Renovar token si ha expirado (con margen de 60 s)
            if (stored.isExpired()) {
                const renewed = await this.psnApiService.refreshToken(stored.refreshToken);
                accessToken = renewed.accessToken;
                await savePsnTokens(renewed);
            }

            // 3. Obtener juegos jugados de PSN
            games = await this.psnApiService.fetchPlayedGames(accessToken);
        }

        if (games.length === 0) return [];

        // Batch write a Firestore (límite 500 docs por batch)
        const BATCH_SIZE = 500;
        for (let i = 0; i < games.length; i += BATCH_SIZE) {
            const batch = writeBatch(this.firestore);
            const chunk = games.slice(i, i + BATCH_SIZE);
            for (const game of chunk) {
                const ref = doc(this.firestore, 'users', userId, 'library', game.getId());
                batch.set(ref, FirestoreGameMapper.toFirestore(game), { merge: true });
            }
            await batch.commit();
        }

        return games;
    }

    async searchGames(query: string): Promise<SearchResult[]> {
        // Búsqueda delegada en ITAD (catálogo más amplio: Steam, Epic, GOG, Humble, etc.)
        return this.itadService.searchGames(query);
    }

    async storeEpicGames(userId: string, games: Game[]): Promise<void> {
        // Almacenar juegos de Epic en Firestore
        if (games.length === 0) return;

        const BATCH_SIZE = 500;
        for (let i = 0; i < games.length; i += BATCH_SIZE) {
            const batch = writeBatch(this.firestore);
            const chunk = games.slice(i, i + BATCH_SIZE);
            for (const game of chunk) {
                const ref = doc(this.firestore, 'users', userId, 'library', game.getId());
                batch.set(ref, FirestoreGameMapper.toFirestore(game), { merge: true });
            }
            await batch.commit();
        }
    }

    async storePsnGames(userId: string, games: Game[]): Promise<void> {
        if (games.length === 0) return;

        const BATCH_SIZE = 500;
        for (let i = 0; i < games.length; i += BATCH_SIZE) {
            const batch = writeBatch(this.firestore);
            const chunk = games.slice(i, i + BATCH_SIZE);
            for (const game of chunk) {
                const ref = doc(this.firestore, 'users', userId, 'library', game.getId());
                batch.set(ref, FirestoreGameMapper.toFirestore(game), { merge: true });
            }
            await batch.commit();
        }
    }

    async updateSteamAppId(userId: string, gameId: string, steamAppId: number): Promise<void> {
        const ref = doc(this.firestore, 'users', userId, 'library', gameId);
        await updateDoc(ref, { steamAppId });
    }

    async getOwnedDlcsForGame(userId: string, parentGameId: string): Promise<Game[]> {
        const allGames = await this.getLibraryGames(userId);
        return allGames.filter(g =>
            g.getGameType() === GameType.DLC && g.getParentGameId() === parentGameId,
        );
    }

}
