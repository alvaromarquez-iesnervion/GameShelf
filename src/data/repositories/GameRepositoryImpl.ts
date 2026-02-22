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

    async getGameById(gameId: string): Promise<Game> {
        const snap = await getDoc(doc(this.firestore, 'games', gameId));
        if (!snap.exists()) {
            throw new Error(`Juego ${gameId} no encontrado en Firestore`);
        }
        return FirestoreGameMapper.toDomain(snap.id, snap.data());
    }

    async getOrCreateGameById(gameId: string, steamAppId?: number | null): Promise<Game> {
        // 1. Intentar resolución directa por ID en la colección global /games
        try {
            return await this.getGameById(gameId);
        } catch { /* no existe en /games — continuar */ }

        // 2. Si el gameId parece un steamAppId numérico (juego que viene de la biblioteca
        //    del usuario, cuyo doc ID en /users/{uid}/library/ es el steamAppId como string),
        //    resolver vía ITAD usando el steamAppId para obtener el itadGameId y el título.
        const looksLikeSteamAppId = /^\d+$/.test(gameId);
        if (looksLikeSteamAppId) {
            const resolvedSteamAppId = steamAppId ?? parseInt(gameId, 10);
            // Obtener el ITAD UUID a partir del steamAppId
            const itadId = await this.itadService.lookupGameIdBySteamAppId(gameId);
            // Si tenemos el itadId, obtener título y cover desde ITAD
            const info = itadId ? await this.itadService.getGameInfo(itadId) : null;

            return new Game(
                gameId,
                info?.title ?? '',
                '',
                info?.coverUrl ?? '',
                Platform.STEAM,
                resolvedSteamAppId,
                itadId ?? null,
                0,
                null,
            );
        }

        // 3. El gameId es un ITAD UUID u otro identificador externo: buscar en ITAD
        const info = await this.itadService.getGameInfo(gameId);
        if (!info) {
            throw new Error(`No se pudo obtener información del juego "${gameId}".`);
        }

        return new Game(
            steamAppId?.toString() ?? gameId,
            info.title,
            '',
            info.coverUrl,
            Platform.STEAM,
            info.steamAppId ?? steamAppId ?? null,
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
