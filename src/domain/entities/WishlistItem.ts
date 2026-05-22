import { Platform as GamePlatform } from '../enums/Platform';

export class WishlistItem {

    private id: string;
    private gameId: string;
    private title: string;
    private coverUrl: string;
    private portraitCoverUrl: string;
    private addedAt: Date;
    private bestDealPercentage: number | null;
    private platform: GamePlatform | null;
    private steamAppId: number | null;

    constructor(
        id: string,
        gameId: string,
        title: string,
        coverUrl: string,
        portraitCoverUrl: string,
        addedAt: Date,
        bestDealPercentage: number | null,
        platform: GamePlatform | null = null,
        steamAppId: number | null = null,
    ) {
        this.id = id;
        this.gameId = gameId;
        this.title = title;
        this.coverUrl = coverUrl;
        this.portraitCoverUrl = portraitCoverUrl;
        this.addedAt = addedAt;
        this.bestDealPercentage = bestDealPercentage;
        this.platform = platform;
        this.steamAppId = steamAppId;
    }

    getId(): string { return this.id; }
    getGameId(): string { return this.gameId; }
    getTitle(): string { return this.title; }
    getCoverUrl(): string { return this.coverUrl; }
    getPortraitCoverUrl(): string { return this.portraitCoverUrl; }
    getAddedAt(): Date { return this.addedAt; }
    // null = sin oferta activa. Se enriquece en WishlistUseCase via ITAD.
    getBestDealPercentage(): number | null { return this.bestDealPercentage; }
    getPlatform(): GamePlatform | null { return this.platform; }
    getSteamAppId(): number | null { return this.steamAppId; }

    withBestDealPercentage(percentage: number | null): WishlistItem {
        return new WishlistItem(this.id, this.gameId, this.title, this.coverUrl, this.portraitCoverUrl, this.addedAt, percentage, this.platform, this.steamAppId);
    }
}
