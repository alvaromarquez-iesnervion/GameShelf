import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { Auth } from 'firebase/auth';
import { IGameShelfApiClient } from '../../domain/interfaces/services/IGameShelfApiClient';
import { Game } from '../../domain/entities/Game';
import { GameDetail } from '../../domain/entities/GameDetail';
import { Deal } from '../../domain/entities/Deal';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { LinkedPlatform } from '../../domain/entities/LinkedPlatform';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { GameType } from '../../domain/enums/GameType';
import { ProtonTier } from '../../domain/entities/ProtonDbRating';
import { SteamGameMetadata } from '../../domain/dtos/SteamGameMetadata';
import { LibraryStats } from '../../domain/entities/LibraryStats';
import { LibraryPage, MergedLibraryGame } from '../../domain/interfaces/repositories/IGameRepository';
import { LibraryTab } from '../../domain/enums/LibraryTab';
import { SortCriteria } from '../../domain/enums/SortCriteria';
import { TYPES } from '../../di/types';

const BASE_URL = process.env.EXPO_PUBLIC_GAMESHELF_API_URL ?? 'http://localhost:8000';

// ── Raw API shapes (camelCase from FastAPI) ───────────────────────────────────

interface ApiGame {
    gameId: string;
    title: string;
    description?: string;
    coverUrl: string;
    portraitCoverUrl?: string;
    platform: string;
    steamAppId: number | null;
    itadGameId?: string | null;
    psnTitleId?: string | null;
    playtime?: number;
    lastPlayed: string | null;
    gameType?: string;
    parentGameId?: string | null;
}

interface ApiDeal {
    id: string;
    storeName: string;
    price: number;
    originalPrice: number;
    discountPercentage: number;
    url: string;
    currency?: string;
}

interface ApiSteamMetadata {
    name?: string;
    genres: string[];
    developers: string[];
    publishers: string[];
    releaseDate: string | null;
    metacriticScore: number | null;
    metacriticUrl?: string | null;
    screenshots: string[];
    recommendationCount: number | null;
    appType?: string | null;
    parentSteamAppId?: number | null;
    dlcAppIds?: number[];
}

interface ApiProtonDb {
    tier: string;
    trendingTier: string;
    totalReports: number;
}

interface ApiHltb {
    mainHours: number | null;
    mainExtraHours: number | null;
    completionistHours: number | null;
}

interface ApiGameDetail {
    game: ApiGame;
    protonDb?: ApiProtonDb | null;
    howLongToBeat?: ApiHltb | null;
    deals: ApiDeal[];
    steamMetadata?: ApiSteamMetadata | null;
    ownedDlcs?: ApiGame[];
    isInWishlist: boolean;
    isInLibrary: boolean;
}

interface ApiWishlistItem {
    id: string;
    gameId: string;
    title: string;
    platform?: string | null;
    steamAppId?: number | null;
    coverUrl?: string | null;
    addedAt: string;
    bestDealPercentage?: number | null;
}

interface ApiLinkedPlatform {
    platform: string;
    externalUserId: string;
    linkedAt: string;
}

interface ApiSearchResult {
    id?: string;
    title: string;
    coverUrl?: string;
    isInWishlist: boolean;
    steamAppId?: number | null;
    gameType?: string | null;
    isOwned: boolean;
    ownedPlatforms: string[];
}

interface ApiMergedGame {
    game: ApiGame;
    platforms: string[];
}

interface ApiLibraryPage {
    games: ApiMergedGame[];
    total: number;
    hasMore: boolean;
    currentPage: number;
}

interface ApiLibraryStats {
    totalGames: number;
    pcGames: number;
    consoleGames: number;
    totalPlaytime: number;
    totalUnique: number;
    pcUnique: number;
    consoleUnique: number;
}

interface ApiPopularGame {
    gameId: string;
    steamAppId: number;
    title: string;
    currentPlayers: number;
    coverUrl?: string | null;
}

interface ApiHomeData {
    popularNow: ApiPopularGame[];
    recentlyPlayed: ApiGame[];
    mostPlayed: ApiGame[];
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function toPlatform(raw: string): Platform {
    const map: Record<string, Platform> = {
        steam: Platform.STEAM,
        epic_games: Platform.EPIC_GAMES,
        gog: Platform.GOG,
        psn: Platform.PSN,
    };
    return map[raw] ?? Platform.UNKNOWN;
}

function toGame(r: ApiGame): Game {
    return new Game(
        r.gameId,
        r.title,
        r.description ?? '',
        r.coverUrl,
        toPlatform(r.platform),
        r.steamAppId ?? null,
        r.itadGameId ?? null,
        r.playtime ?? 0,
        r.lastPlayed ? new Date(r.lastPlayed) : null,
        r.portraitCoverUrl ?? '',
        r.gameType?.toLowerCase() === 'dlc' ? GameType.DLC : GameType.GAME,
        r.parentGameId ?? null,
        r.psnTitleId ?? null,
    );
}

function toMergedGame(r: ApiMergedGame): MergedLibraryGame {
    return {
        game: toGame(r.game),
        platforms: r.platforms.map(toPlatform),
    };
}

function toDeal(r: ApiDeal): Deal {
    return new Deal(
        r.id,
        r.storeName,
        r.price,
        r.originalPrice,
        r.discountPercentage,
        r.url,
        r.currency ?? 'USD',
    );
}

function toSteamMetadata(r: ApiSteamMetadata): SteamGameMetadata {
    return {
        name: r.name ?? '',
        genres: r.genres,
        developers: r.developers,
        publishers: r.publishers,
        releaseDate: r.releaseDate,
        metacriticScore: r.metacriticScore,
        metacriticUrl: r.metacriticUrl ?? null,
        screenshots: r.screenshots,
        recommendationCount: r.recommendationCount,
        appType: r.appType ?? null,
        parentSteamAppId: r.parentSteamAppId ?? null,
        dlcAppIds: r.dlcAppIds ?? [],
    };
}

function toGameDetail(r: ApiGameDetail): GameDetail {
    return new GameDetail(
        toGame(r.game),
        (r.protonDb?.tier as ProtonTier | null) ?? null,
        (r.protonDb?.trendingTier as ProtonTier | null) ?? null,
        r.protonDb?.totalReports ?? null,
        r.howLongToBeat?.mainHours ?? null,
        r.howLongToBeat?.mainExtraHours ?? null,
        r.howLongToBeat?.completionistHours ?? null,
        r.deals.map(toDeal),
        r.steamMetadata ? toSteamMetadata(r.steamMetadata) : null,
        (r.ownedDlcs ?? []).map(toGame),
        r.isInLibrary,
    );
}

function toWishlistItem(r: ApiWishlistItem): WishlistItem {
    return new WishlistItem(
        r.id,
        r.gameId,
        r.title,
        r.coverUrl ?? '',
        new Date(r.addedAt),
        r.bestDealPercentage ?? null,
        r.platform ? toPlatform(r.platform) : null,
        r.steamAppId ?? null,
    );
}

function toLinkedPlatform(r: ApiLinkedPlatform): LinkedPlatform {
    return new LinkedPlatform(
        toPlatform(r.platform),
        r.externalUserId,
        new Date(r.linkedAt),
    );
}

function toSearchResult(r: ApiSearchResult): SearchResult {
    let gameType: GameType | null = null;
    if (r.gameType) {
        const normalized = r.gameType.toLowerCase();
        gameType = normalized === 'dlc' ? GameType.DLC : GameType.GAME;
    }
    return new SearchResult(
        r.id ?? '',
        r.title,
        r.coverUrl ?? '',
        r.isInWishlist,
        r.steamAppId ?? null,
        gameType,
        r.isOwned,
        r.ownedPlatforms.map(toPlatform),
    );
}

function toPopularGame(r: ApiPopularGame): Game {
    return new Game(
        r.gameId,
        r.title,
        '',
        r.coverUrl ?? '',
        Platform.STEAM,
        r.steamAppId,
        null,
        0,
        null,
        '',
        GameType.GAME,
        null,
        null,
    );
}

// ── Client ────────────────────────────────────────────────────────────────────

@injectable()
export class GameShelfApiClientImpl implements IGameShelfApiClient {

    private _homeCache: { data: ApiHomeData; expiresAt: number } | null = null;
    private _homePending: Promise<ApiHomeData> | null = null;
    private static readonly HOME_TTL_MS = 30_000; // 30 s

    constructor(
        @inject(TYPES.FirebaseAuth) private auth: Auth,
    ) {}

    private async authHeaders(): Promise<Record<string, string>> {
        const token = await this.auth.currentUser?.getIdToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const headers = await this.authHeaders();
        const response = await fetch(`${BASE_URL}${path}`, {
            ...options,
            headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
        });
        if (!response.ok) {
            const body = await response.text().catch(() => '');
            throw new Error(`GameShelfApi ${response.status}: ${body}`);
        }
        if (response.status === 204) return undefined as unknown as T;
        return response.json() as Promise<T>;
    }

    // ── Auth ──────────────────────────────────────────────────────────────

    async syncUser(): Promise<void> {
        await this.request('/api/v1/auth/sync', { method: 'POST' });
    }

    // ── Library ───────────────────────────────────────────────────────────

    /** @deprecated Usar getLibraryGamesPage con paginación. */
    async getLibraryGames(): Promise<Game[]> {
        const data = await this.request<ApiLibraryPage>('/api/v1/library?page_size=500');
        return data.games.map(r => toGame(r.game));
    }

    async getLibraryGamesPage(
        pageSize: number,
        page: number = 1,
        tab?: LibraryTab,
        sortCriteria?: SortCriteria,
        searchQuery?: string,
        platforms?: Platform[],
    ): Promise<LibraryPage> {
        const params = new URLSearchParams({
            page: String(page),
            page_size: String(pageSize),
        });
        if (tab) params.set('tab', tab.toLowerCase());
        if (sortCriteria) params.set('sort', sortCriteria.toLowerCase());
        if (searchQuery && searchQuery.trim()) params.set('search', searchQuery.trim());
        if (platforms && platforms.length > 0) {
            for (const p of platforms) params.append('platforms', p.toLowerCase());
        }
        const data = await this.request<ApiLibraryPage>(`/api/v1/library?${params}`);
        return {
            games: data.games.map(toMergedGame),
            total: data.total,
            hasMore: data.hasMore,
            currentPage: page,
        };
    }

    async getLibraryStats(): Promise<LibraryStats> {
        const data = await this.request<ApiLibraryStats>('/api/v1/library/stats');
        return new LibraryStats(data.totalUnique, data.pcUnique, data.consoleUnique, data.totalPlaytime);
    }

    async syncLibrary(platform: Platform): Promise<Game[]> {
        const data = await this.request<{ games: ApiGame[] }>(`/api/v1/library/sync`, {
            method: 'POST',
            body: JSON.stringify({ platform: platform.toLowerCase() }),
        });
        return data.games.map(toGame);
    }

    // ── Settings / Preferences ────────────────────────────────────────────

    async getSavedCountry(): Promise<string | null> {
        try {
            const data = await this.request<{ country_code: string } | null>('/api/v1/settings/country');
            return data?.country_code ?? null;
        } catch {
            return null;
        }
    }

    async setSavedCountry(country: string): Promise<void> {
        await this.request('/api/v1/settings/country', {
            method: 'PUT',
            body: JSON.stringify({ country_code: country }),
        });
    }

    // ── Games ─────────────────────────────────────────────────────────────

    async getGameDetail(gameId: string, steamAppId?: number | null, platform?: Platform | null, country?: string): Promise<GameDetail> {
        const params = new URLSearchParams();
        if (steamAppId != null) params.set('steam_app_id', String(steamAppId));
        if (platform) params.set('platform', platform.toLowerCase());
        if (country) params.set('country', country);
        const query = params.toString();
        const data = await this.request<ApiGameDetail>(`/api/v1/games/${encodeURIComponent(gameId)}${query ? `?${query}` : ''}`);
        return toGameDetail(data);
    }

    async getOrCreateGame(gameId: string, steamAppId?: number | null): Promise<Game> {
        const params = new URLSearchParams({ game_id: gameId });
        if (steamAppId != null) params.set('steam_app_id', String(steamAppId));
        const data = await this.request<ApiGameDetail>(`/api/v1/games/${encodeURIComponent(gameId)}?${params}`);
        return toGame(data.game);
    }

    async getOwnedDlcs(parentGameId: string): Promise<Game[]> {
        const data = await this.request<{ dlcs: ApiGame[] }>(
            `/api/v1/games/${encodeURIComponent(parentGameId)}/dlcs`,
        );
        return data.dlcs.map(toGame);
    }

    // ── Search ────────────────────────────────────────────────────────────

    async searchGames(query: string): Promise<SearchResult[]> {
        const data = await this.request<{ results: ApiSearchResult[] }>(
            `/api/v1/search?q=${encodeURIComponent(query)}`,
        );
        return data.results.map(toSearchResult);
    }

    // ── Wishlist ──────────────────────────────────────────────────────────

    async getWishlist(country?: string): Promise<WishlistItem[]> {
        const params = new URLSearchParams();
        if (country) params.set('country', country);
        const query = params.toString();
        const data = await this.request<{ items: ApiWishlistItem[] }>(`/api/v1/wishlist${query ? `?${query}` : ''}`);
        return data.items.map(toWishlistItem);
    }

    async addToWishlist(gameId: string, title: string, coverUrl: string, platform?: Platform | null, steamAppId?: number | null): Promise<WishlistItem> {
        const platformStr = platform ? platform.toLowerCase() : null;
        const data = await this.request<ApiWishlistItem>('/api/v1/wishlist', {
            method: 'POST',
            body: JSON.stringify({ gameId, title, coverUrl, platform: platformStr, steamAppId }),
        });
        return toWishlistItem(data);
    }

    async removeFromWishlist(itemId: string): Promise<void> {
        await this.request(`/api/v1/wishlist/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
    }

    async isInWishlist(gameId: string): Promise<boolean> {
        const data = await this.request<{ isInWishlist: boolean }>(
            `/api/v1/wishlist/check/${encodeURIComponent(gameId)}`,
        );
        return data.isInWishlist;
    }

    // ── Platforms ─────────────────────────────────────────────────────────

    async getLinkedPlatforms(): Promise<LinkedPlatform[]> {
        const data = await this.request<ApiLinkedPlatform[]>('/api/v1/platforms');
        return data.map(toLinkedPlatform);
    }

    async getPlatformAuthUrl(platform: Platform): Promise<string> {
        const slug = platform.toLowerCase();
        const data = await this.request<{ url: string }>(`/api/v1/platforms/${slug}/auth-url`);
        return data.url;
    }

    async linkSteamOpenId(callbackUrl: string): Promise<LinkedPlatform> {
        const data = await this.request<ApiLinkedPlatform>('/api/v1/platforms/steam/link/openid', {
            method: 'POST',
            body: JSON.stringify({ callbackUrl }),
        });
        return toLinkedPlatform(data);
    }

    async linkSteamManual(profileUrlOrId: string): Promise<LinkedPlatform> {
        const data = await this.request<ApiLinkedPlatform>('/api/v1/platforms/steam/link', {
            method: 'POST',
            body: JSON.stringify({ profileUrlOrId }),
        });
        return toLinkedPlatform(data);
    }

    async linkWithCode(platform: Platform, code: string): Promise<LinkedPlatform> {
        const path = platform === Platform.GOG
            ? '/api/v1/platforms/gog/link'
            : `/api/v1/platforms/${platform.toLowerCase()}/link/authcode`;
        const data = await this.request<ApiLinkedPlatform>(path, {
            method: 'POST',
            body: JSON.stringify({ authCode: code }),
        });
        return toLinkedPlatform(data);
    }

    async linkWithNpsso(npsso: string): Promise<LinkedPlatform> {
        const data = await this.request<ApiLinkedPlatform>('/api/v1/platforms/psn/link', {
            method: 'POST',
            body: JSON.stringify({ npssoCode: npsso }),
        });
        return toLinkedPlatform(data);
    }

    async linkWithGdpr(games: object[]): Promise<LinkedPlatform> {
        const data = await this.request<ApiLinkedPlatform>('/api/v1/platforms/epic/link/gdpr', {
            method: 'POST',
            body: JSON.stringify({ jsonContent: JSON.stringify(games) }),
        });
        return toLinkedPlatform(data);
    }

    async unlinkPlatform(platform: Platform): Promise<void> {
        const slug = platform.toLowerCase();
        await this.request(`/api/v1/platforms/${slug}`, { method: 'DELETE' });
    }

    // ── Home ──────────────────────────────────────────────────────────────

    private _getHomeData(): Promise<ApiHomeData> {
        const now = Date.now();
        if (this._homeCache && this._homeCache.expiresAt > now) {
            return Promise.resolve(this._homeCache.data);
        }
        if (this._homePending) return this._homePending;
        this._homePending = this.request<ApiHomeData>('/api/v1/home').then(data => {
            this._homeCache = { data, expiresAt: Date.now() + GameShelfApiClientImpl.HOME_TTL_MS };
            this._homePending = null;
            return data;
        }).catch(err => {
            this._homePending = null;
            throw err;
        });
        return this._homePending;
    }

    async getPopularGames(): Promise<Game[]> {
        const data = await this._getHomeData();
        return (data.popularNow ?? []).map(toPopularGame);
    }

    async getRecentlyPlayed(): Promise<Game[]> {
        const data = await this._getHomeData();
        return data.recentlyPlayed.map(toGame);
    }

    async getMostPlayed(): Promise<Game[]> {
        const data = await this._getHomeData();
        return data.mostPlayed.map(toGame);
    }

    // ── Notification Preferences ──────────────────────────────────────────

    async getNotificationPreferences(): Promise<{ dealsEnabled: boolean }> {
        const data = await this.request<{ dealsEnabled: boolean }>('/api/v1/settings/notifications');
        return { dealsEnabled: data.dealsEnabled ?? false };
    }

    async updateNotificationPreferences(dealsEnabled: boolean): Promise<void> {
        await this.request('/api/v1/settings/notifications', {
            method: 'PUT',
            body: JSON.stringify({ dealsEnabled }),
        });
    }

    // ── Push Notifications ────────────────────────────────────────────────

    async registerPushToken(expoToken: string, platform: 'ios' | 'android' | 'web'): Promise<{ tokenId: string }> {
        const data = await this.request<{ token_id: string }>('/api/v1/settings/push-tokens', {
            method: 'POST',
            body: JSON.stringify({ expo_token: expoToken, platform }),
        });
        return { tokenId: data.token_id };
    }

    async removePushToken(tokenId: string): Promise<void> {
        await this.request(`/api/v1/settings/push-tokens/${encodeURIComponent(tokenId)}`, { method: 'DELETE' });
    }

    async unregisterAllPushTokens(): Promise<void> {
        await this.request('/api/v1/settings/push-tokens', { method: 'DELETE' });
    }

    clearCache(): void {
        this._homeCache = null;
        this._homePending = null;
    }
}
