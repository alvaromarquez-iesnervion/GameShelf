import { injectable } from 'inversify';
import 'reflect-metadata';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';
import { Game } from '../../domain/entities/Game';
import { GameDetail } from '../../domain/entities/GameDetail';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { LibraryPage } from '../../domain/interfaces/repositories/IGameRepository';

/** Stub sin estado — devuelve colecciones vacías. Solo para modo mock (sin Firebase). */
@injectable()
export class MockGameShelfApiClient implements IGameShelfApiClient {
    syncUser(): Promise<void> { return Promise.resolve(); }

    getLibraryGames(): Promise<Game[]> { return Promise.resolve([]); }
    getLibraryGamesPage(_pageSize: number, _cursor?: string): Promise<LibraryPage> {
        return Promise.resolve({ games: [], nextCursor: null });
    }
    syncLibrary(_platform: Platform): Promise<Game[]> { return Promise.resolve([]); }

    getGameDetail(gameId: string): Promise<GameDetail> {
        return Promise.reject(new Error(`MockGameShelfApiClient: getGameDetail(${gameId}) not available in mock mode`));
    }
    getOrCreateGame(gameId: string): Promise<Game> {
        return Promise.reject(new Error(`MockGameShelfApiClient: getOrCreateGame(${gameId}) not available in mock mode`));
    }
    getOwnedDlcs(_parentGameId: string): Promise<Game[]> { return Promise.resolve([]); }

    searchGames(_query: string): Promise<SearchResult[]> { return Promise.resolve([]); }

    getWishlist(): Promise<WishlistItem[]> { return Promise.resolve([]); }
    addToWishlist(_gameId: string, _title: string, _coverUrl: string, _platform?: string | null): Promise<WishlistItem> {
        return Promise.reject(new Error('MockGameShelfApiClient: addToWishlist not available in mock mode'));
    }
    removeFromWishlist(_itemId: string): Promise<void> { return Promise.resolve(); }
    isInWishlist(_gameId: string): Promise<boolean> { return Promise.resolve(false); }

    getLinkedPlatforms(): Promise<LinkedPlatform[]> { return Promise.resolve([]); }
    getPlatformAuthUrl(_platform: Platform): Promise<string> {
        return Promise.reject(new Error('MockGameShelfApiClient: getPlatformAuthUrl not available in mock mode'));
    }
    linkSteamOpenId(_callbackUrl: string): Promise<LinkedPlatform> {
        return Promise.reject(new Error('MockGameShelfApiClient: linkSteamOpenId not available in mock mode'));
    }
    linkSteamManual(_profileUrlOrId: string): Promise<LinkedPlatform> {
        return Promise.reject(new Error('MockGameShelfApiClient: linkSteamManual not available in mock mode'));
    }
    linkWithCode(_platform: Platform, _code: string): Promise<LinkedPlatform> {
        return Promise.reject(new Error('MockGameShelfApiClient: linkWithCode not available in mock mode'));
    }
    linkWithNpsso(_npsso: string): Promise<LinkedPlatform> {
        return Promise.reject(new Error('MockGameShelfApiClient: linkWithNpsso not available in mock mode'));
    }
    linkWithGdpr(_games: object[]): Promise<LinkedPlatform> {
        return Promise.reject(new Error('MockGameShelfApiClient: linkWithGdpr not available in mock mode'));
    }
    unlinkPlatform(_platform: Platform): Promise<void> { return Promise.resolve(); }

    getPopularGames(): Promise<Game[]> { return Promise.resolve([]); }
    getRecentlyPlayed(): Promise<Game[]> { return Promise.resolve([]); }
    getMostPlayed(): Promise<Game[]> { return Promise.resolve([]); }
}
