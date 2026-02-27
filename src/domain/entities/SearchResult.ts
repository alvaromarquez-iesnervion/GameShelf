import { Platform } from '../enums/Platform';

export class SearchResult {

    private id: string;
    private title: string;
    private coverUrl: string;
    private isInWishlist: boolean;
    private steamAppId: number | null;
    private owned: boolean;
    private ownedPlatform: Platform;

    constructor(
        id: string,
        title: string,
        coverUrl: string,
        isInWishlist: boolean,
        steamAppId: number | null = null,
        owned: boolean = false,
        ownedPlatform: Platform = Platform.UNKNOWN,
    ) {
        this.id = id;
        this.title = title;
        this.coverUrl = coverUrl;
        this.isInWishlist = isInWishlist;
        this.steamAppId = steamAppId;
        this.owned = owned;
        this.ownedPlatform = ownedPlatform;
    }

    getId(): string { return this.id; }
    getTitle(): string { return this.title; }
    getCoverUrl(): string { return this.coverUrl; }
    getIsInWishlist(): boolean { return this.isInWishlist; }
    getSteamAppId(): number | null { return this.steamAppId; }
    getIsOwned(): boolean { return this.owned; }
    getOwnedPlatform(): Platform { return this.ownedPlatform; }

    setIsInWishlist(value: boolean): void { this.isInWishlist = value; }
    setSteamAppId(value: number | null): void { this.steamAppId = value; }
    setIsOwned(value: boolean): void { this.owned = value; }
    setOwnedPlatform(value: Platform): void { this.ownedPlatform = value; }
}
