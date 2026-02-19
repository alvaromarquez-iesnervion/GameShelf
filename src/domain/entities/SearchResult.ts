export class SearchResult {

    private id: string;
    private title: string;
    private coverUrl: string;
    private isInWishlist: boolean;
    private steamAppId: number | null;

    constructor(
        id: string,
        title: string,
        coverUrl: string,
        isInWishlist: boolean,
        steamAppId: number | null = null,
    ) {
        this.id = id;
        this.title = title;
        this.coverUrl = coverUrl;
        this.isInWishlist = isInWishlist;
        this.steamAppId = steamAppId;
    }

    getId(): string { return this.id; }
    getTitle(): string { return this.title; }
    getCoverUrl(): string { return this.coverUrl; }
    getIsInWishlist(): boolean { return this.isInWishlist; }
    getSteamAppId(): number | null { return this.steamAppId; }

    setIsInWishlist(value: boolean): void { this.isInWishlist = value; }
    setSteamAppId(value: number | null): void { this.steamAppId = value; }
}
