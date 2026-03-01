import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { IGameRepository } from '../../domain/interfaces/repositories/IGameRepository';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { TYPES } from '../../di/types';
import { isGuestUser } from '../../core/utils/guestUtils';

@injectable()
export class GuestAwareGameRepository implements IGameRepository {

    constructor(
        @inject(TYPES.FirestoreGameRepository)
        private readonly firestoreRepo: IGameRepository,
        @inject(TYPES.LocalGameRepository)
        private readonly localRepo: IGameRepository,
    ) {}

    private repo(userId: string): IGameRepository {
        return isGuestUser(userId) ? this.localRepo : this.firestoreRepo;
    }

    getLibraryGames(userId: string): Promise<Game[]> {
        return this.repo(userId).getLibraryGames(userId);
    }

    getGameById(userId: string, gameId: string): Promise<Game> {
        return this.repo(userId).getGameById(userId, gameId);
    }

    getOrCreateGameById(userId: string, gameId: string, steamAppId?: number | null): Promise<Game> {
        return this.repo(userId).getOrCreateGameById(userId, gameId, steamAppId);
    }

    syncLibrary(userId: string, platform: Platform): Promise<Game[]> {
        return this.repo(userId).syncLibrary(userId, platform);
    }

    // searchGames is user-agnostic (ITAD only) — always use firestoreRepo.
    searchGames(query: string): Promise<SearchResult[]> {
        return this.firestoreRepo.searchGames(query);
    }

    storeEpicGames(userId: string, games: Game[]): Promise<void> {
        return this.repo(userId).storeEpicGames(userId, games);
    }

    updateSteamAppId(userId: string, gameId: string, steamAppId: number): Promise<void> {
        return this.repo(userId).updateSteamAppId(userId, gameId, steamAppId);
    }
}
