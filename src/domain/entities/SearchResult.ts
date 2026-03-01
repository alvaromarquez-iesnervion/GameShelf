import { Platform } from '../enums/Platform';

export class SearchResult {

    private id: string;
    private title: string;
    private coverUrl: string;
    private isInWishlist: boolean;
    private steamAppId: number | null;
    private owned: boolean;
    private ownedPlatforms: Platform[];

    constructor(
        id: string,
        title: string,
        coverUrl: string,
        isInWishlist: boolean,
        steamAppId: number | null = null,
        owned: boolean = false,
        ownedPlatforms: Platform[] = [],
    ) {
        this.id = id;
        this.title = title;
        this.coverUrl = coverUrl;
        this.isInWishlist = isInWishlist;
        this.steamAppId = steamAppId;
        this.owned = owned;
        this.ownedPlatforms = ownedPlatforms;
    }

    getId(): string { return this.id; }
    getTitle(): string { return this.title; }
    getCoverUrl(): string { return this.coverUrl; }
    getIsInWishlist(): boolean { return this.isInWishlist; }
    getSteamAppId(): number | null { return this.steamAppId; }
    getIsOwned(): boolean { return this.owned; }
    getOwnedPlatforms(): Platform[] { return this.ownedPlatforms; }

    setIsInWishlist(value: boolean): void { this.isInWishlist = value; }
    setSteamAppId(value: number | null): void { this.steamAppId = value; }
    setIsOwned(value: boolean): void { this.owned = value; }
    addOwnedPlatform(value: Platform): void { this.ownedPlatforms.push(value); }
}
