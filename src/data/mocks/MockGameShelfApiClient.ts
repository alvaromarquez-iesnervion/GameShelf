import { injectable } from 'inversify';
import 'reflect-metadata';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';
import { Game } from '../../domain/entities/Game';
import { GameDetail } from '../../domain/entities/GameDetail';
import { LibraryStats } from '../../domain/entities/LibraryStats';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { LibraryPage } from '../../domain/interfaces/repositories/IGameRepository';
import { LibraryTab } from '../../domain/enums/LibraryTab';
import { SortCriteria } from '../../domain/enums/SortCriteria';

/** Stub sin estado — devuelve colecciones vacías. Solo para modo mock (sin Firebase). */
@injectable()
export class MockGameShelfApiClient implements IGameShelfApiClient {
    syncUser(): Promise<void> { return Promise.resolve(); }

    getLibraryGamesPage(_pageSize: number, _page?: number, _tab?: LibraryTab, _sortCriteria?: SortCriteria, _searchQuery?: string, _platforms?: Platform[]): Promise<LibraryPage> {
        return Promise.resolve({ games: [], total: 0, hasMore: false, currentPage: _page ?? 1 });
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

    getLibraryStats(): Promise<LibraryStats> { return Promise.resolve(new LibraryStats(0, 0, 0, 0)); }

    getSavedCountry(): Promise<string | null> { return Promise.resolve(null); }
    setSavedCountry(_country: string): Promise<void> { return Promise.resolve(); }

    clearCache(): void {}
}
