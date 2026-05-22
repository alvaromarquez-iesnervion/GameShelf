import { Game } from '../../entities/Game';
import { GameDetail } from '../../entities/GameDetail';
import { WishlistItem } from '../../entities/WishlistItem';
import { LinkedPlatform } from '../../entities/LinkedPlatform';
import { LibraryStats } from '../../entities/LibraryStats';
import { SearchResult } from '../../entities/SearchResult';
import { Platform } from '../../enums/Platform';
import { LibraryPage } from '../repositories/IGameRepository';
import { LibraryTab } from '../../enums/LibraryTab';
import { SortCriteria } from '../../enums/SortCriteria';

export interface IGameShelfApiClient {
    // ── Auth ──────────────────────────────────────────────────────────────
    /** Registers / updates the user profile in the backend after login. */
    syncUser(): Promise<void>;
    /** Deletes the user account (Firestore data + Firebase Auth). Irreversible. */
    deleteAccount(): Promise<void>;

    // ── Library ───────────────────────────────────────────────────────────
    /** Returns aggregated library stats (unique games per platform, playtime). */
    getLibraryStats(): Promise<LibraryStats>;
    /**
     * Returns a paginated and filtered page of the library.
     * @param pageSize     Maximum number of games per page.
     * @param page         Page number (1-indexed).
     * @param tab          Filter by PC/Console tab.
     * @param sortCriteria Sort criterion.
     * @param searchQuery  Search term.
     * @param platforms    List of platforms to filter by.
     */
    getLibraryGamesPage(
        pageSize: number,
        page?: number,
        tab?: LibraryTab,
        sortCriteria?: SortCriteria,
        searchQuery?: string,
        platforms?: Platform[],
    ): Promise<LibraryPage>;
    /** Syncs the library for the given platform and returns the updated games. */
    syncLibrary(platform: Platform): Promise<Game[]>;

    // ── Settings / Preferences ────────────────────────────────────────────
    /** Returns the country code stored in the backend, or null if no preference is set. */
    getSavedCountry(): Promise<string | null>;
    /** Saves the user's country preference (e.g. "ES", "MX"). */
    setSavedCountry(country: string): Promise<void>;

    // ── Games ─────────────────────────────────────────────────────────────
    /** Enriched game detail: ProtonDB + HLTB + ITAD + Steam metadata. */
    getGameDetail(gameId: string, steamAppId?: number | null, platform?: Platform | null, country?: string): Promise<GameDetail>;
    /**
     * Looks up the game in the user's library.
     * If not found, resolves it from the catalogue (ITAD/Steam).
     */
    getOrCreateGame(gameId: string, steamAppId?: number | null): Promise<Game>;
    /** DLCs owned by the user for the given base game. */
    getOwnedDlcs(parentGameId: string): Promise<Game[]>;

    // ── Search ────────────────────────────────────────────────────────────
    /** Full-text search across the catalogue with ownership and wishlist status. */
    searchGames(query: string): Promise<SearchResult[]>;

    // ── Wishlist ──────────────────────────────────────────────────────────
    /** Returns the user's wishlist, optionally with prices in a specific currency. */
    getWishlist(country?: string): Promise<WishlistItem[]>;
    addToWishlist(gameId: string, title: string, coverUrl: string, platform?: Platform | null): Promise<WishlistItem>;
    removeFromWishlist(itemId: string): Promise<void>;
    isInWishlist(gameId: string): Promise<boolean>;

    // ── Platforms ─────────────────────────────────────────────────────────
    getLinkedPlatforms(): Promise<LinkedPlatform[]>;
    /** OAuth URL that the client must open in a WebView. */
    getPlatformAuthUrl(platform: Platform): Promise<string>;
    /** Links Steam via OpenID: sends the full callback URL (including OpenID params). */
    linkSteamOpenId(callbackUrl: string): Promise<LinkedPlatform>;
    /** Links Steam manually via SteamID or profile URL. */
    linkSteamManual(profileUrlOrId: string): Promise<LinkedPlatform>;
    /** Links Epic (auth code) or GOG (authorization code) with the backend. */
    linkWithCode(platform: Platform, code: string): Promise<LinkedPlatform>;
    /** Links PSN using the NPSSO token provided by the user. */
    linkWithNpsso(npsso: string): Promise<LinkedPlatform>;
    /** Links Epic using the GDPR export (array of parsed games). */
    linkWithGdpr(games: object[]): Promise<LinkedPlatform>;
    unlinkPlatform(platform: Platform): Promise<void>;

    // ── Home ──────────────────────────────────────────────────────────────
    getPopularGames(): Promise<Game[]>;
    getRecentlyPlayed(): Promise<Game[]>;
    getMostPlayed(): Promise<Game[]>;

    // ── Cache ─────────────────────────────────────────────────────────────
    clearCache(): void;

    // ── Notification Preferences ──────────────────────────────────────────
    /** Returns the user's notification preferences. */
    getNotificationPreferences(): Promise<{ dealsEnabled: boolean }>;
    /** Updates the user's notification preferences. */
    updateNotificationPreferences(dealsEnabled: boolean): Promise<void>;

    // ── Push Notifications ────────────────────────────────────────────────
    /** Registers an Expo push token in the backend. */
    registerPushToken(expoToken: string, platform: 'ios' | 'android' | 'web'): Promise<{ tokenId: string }>;
    /** Removes a registered push token by its ID. */
    removePushToken(tokenId: string): Promise<void>;
    /** Removes all registered push tokens from the backend. */
    unregisterAllPushTokens(): Promise<void>;
}
