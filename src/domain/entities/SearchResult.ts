import { GameType } from '../enums/GameType';
import { Platform } from '../enums/Platform';

export class SearchResult {

    private id: string;
    private title: string;
    private coverUrl: string;
    private isInWishlist: boolean;
    private steamAppId: number | null;
    private gameType: GameType | null;
    private owned: boolean;
    private ownedPlatforms: Platform[];

    constructor(
        id: string,
        title: string,
        coverUrl: string,
        isInWishlist: boolean,
        steamAppId: number | null = null,
        gameType: GameType | null = null,
        owned: boolean = false,
        ownedPlatforms: Platform[] = [],
    ) {
        this.id = id;
        this.title = title;
        this.coverUrl = coverUrl;
        this.isInWishlist = isInWishlist;
        this.steamAppId = steamAppId;
        this.gameType = gameType;
        this.owned = owned;
        this.ownedPlatforms = ownedPlatforms;
    }

    getId(): string { return this.id; }
    getTitle(): string { return this.title; }
    getCoverUrl(): string { return this.coverUrl; }
    getIsInWishlist(): boolean { return this.isInWishlist; }
    getSteamAppId(): number | null { return this.steamAppId; }
    getGameType(): GameType | null { return this.gameType; }
    getIsOwned(): boolean { return this.owned; }
    getOwnedPlatforms(): Platform[] { return this.ownedPlatforms; }

    withIsInWishlist(value: boolean): SearchResult {
        return new SearchResult(this.id, this.title, this.coverUrl, value, this.steamAppId, this.gameType, this.owned, this.ownedPlatforms);
    }
    withSteamAppId(value: number | null): SearchResult {
        return new SearchResult(this.id, this.title, this.coverUrl, this.isInWishlist, value, this.gameType, this.owned, this.ownedPlatforms);
    }
    withGameType(value: GameType | null): SearchResult {
        return new SearchResult(this.id, this.title, this.coverUrl, this.isInWishlist, this.steamAppId, value, this.owned, this.ownedPlatforms);
    }
    withIsOwned(value: boolean): SearchResult {
        return new SearchResult(this.id, this.title, this.coverUrl, this.isInWishlist, this.steamAppId, this.gameType, value, this.ownedPlatforms);
    }
    withOwnedPlatforms(platforms: Platform[]): SearchResult {
        return new SearchResult(this.id, this.title, this.coverUrl, this.isInWishlist, this.steamAppId, this.gameType, this.owned, platforms);
    }
}
