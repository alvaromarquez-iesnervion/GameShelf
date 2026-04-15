export class WishlistItem {

    private id: string;
    private gameId: string;
    private title: string;
    private coverUrl: string;
    private addedAt: Date;
    private bestDealPercentage: number | null;
    private platform: string | null;

    constructor(
        id: string,
        gameId: string,
        title: string,
        coverUrl: string,
        addedAt: Date,
        bestDealPercentage: number | null,
        platform: string | null = null,
    ) {
        this.id = id;
        this.gameId = gameId;
        this.title = title;
        this.coverUrl = coverUrl;
        this.addedAt = addedAt;
        this.bestDealPercentage = bestDealPercentage;
        this.platform = platform;
    }

    getId(): string { return this.id; }
    getGameId(): string { return this.gameId; }
    getTitle(): string { return this.title; }
    getCoverUrl(): string { return this.coverUrl; }
    getAddedAt(): Date { return this.addedAt; }
    // null = sin oferta activa. Se enriquece en WishlistUseCase via ITAD.
    getBestDealPercentage(): number | null { return this.bestDealPercentage; }
    getPlatform(): string | null { return this.platform; }

    withBestDealPercentage(percentage: number | null): WishlistItem {
        return new WishlistItem(this.id, this.gameId, this.title, this.coverUrl, this.addedAt, percentage, this.platform);
    }
}
