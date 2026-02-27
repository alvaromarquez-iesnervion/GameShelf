import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    Firestore,
    collection,
    doc,
    getDoc,
    getDocs,
    writeBatch,
} from 'firebase/firestore';
import { IGameRepository } from '../../domain/interfaces/repositories/IGameRepository';
import { ISteamApiService } from '../../domain/interfaces/services/ISteamApiService';
import { IEpicGamesApiService } from '../../domain/interfaces/services/IEpicGamesApiService';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { FirestoreGameMapper } from '../mappers/FirestoreGameMapper';
import { TYPES } from '../../di/types';

@injectable()
export class GameRepositoryImpl implements IGameRepository {

    constructor(
        @inject(TYPES.Firestore) private firestore: Firestore,
        @inject(TYPES.ISteamApiService) private steamApiService: ISteamApiService,
        @inject(TYPES.IEpicGamesApiService) private epicGamesApiService: IEpicGamesApiService,
        @inject(TYPES.IIsThereAnyDealService) private itadService: IIsThereAnyDealService,
    ) {}

    async getLibraryGames(userId: string): Promise<Game[]> {
        const snap = await getDocs(
            collection(this.firestore, 'users', userId, 'library'),
        );
        return snap.docs.map(d => FirestoreGameMapper.toDomain(d.id, d.data()));
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
            // Intentar biblioteca una vez más con el valor numérico como string
            try {
                return await this.getGameById(userId, gameId);
            } catch { /* no en biblioteca */ }

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
            // Epic no tiene API: los juegos ya están en Firestore tras la importación.
            // syncLibrary para Epic solo devuelve lo que hay en caché.
            return this.getLibraryGames(userId);
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
}
