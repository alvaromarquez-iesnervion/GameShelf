export class WishlistItem {

    private id: string;
    private gameId: string;
    private title: string;
    private coverUrl: string;
    private addedAt: Date;
    private bestDealPercentage: number | null;

    constructor(
        id: string,
        gameId: string,
        title: string,
        coverUrl: string,
        addedAt: Date,
        bestDealPercentage: number | null,
    ) {
        this.id = id;
        this.gameId = gameId;
        this.title = title;
        this.coverUrl = coverUrl;
        this.addedAt = addedAt;
        this.bestDealPercentage = bestDealPercentage;
    }

    getId(): string { return this.id; }
    getGameId(): string { return this.gameId; }
    getTitle(): string { return this.title; }
    getCoverUrl(): string { return this.coverUrl; }
    getAddedAt(): Date { return this.addedAt; }
    // null = sin oferta activa. Se enriquece en WishlistUseCase via ITAD.
    getBestDealPercentage(): number | null { return this.bestDealPercentage; }

    setBestDealPercentage(percentage: number | null): void {
        this.bestDealPercentage = percentage;
    }
}
