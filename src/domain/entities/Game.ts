import { Platform } from '../enums/Platform';

export class Game {

    private id: string;
    private title: string;
    private description: string;
    private coverUrl: string;
    private platform: Platform;
    private steamAppId: number | null;
    private itadGameId: string | null;
    private playtime: number;
    private lastPlayed: Date | null;

    constructor(
        id: string,
        title: string,
        description: string,
        coverUrl: string,
        platform: Platform,
        steamAppId: number | null,
        itadGameId: string | null,
        playtime: number = 0,
        lastPlayed: Date | null = null,
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.coverUrl = coverUrl;
        this.platform = platform;
        this.steamAppId = steamAppId;
        this.itadGameId = itadGameId;
        this.playtime = playtime;
        this.lastPlayed = lastPlayed;
    }

    getId(): string { return this.id; }
    getTitle(): string { return this.title; }
    getDescription(): string { return this.description; }
    getCoverUrl(): string { return this.coverUrl; }
    getPlatform(): Platform { return this.platform; }
    getSteamAppId(): number | null { return this.steamAppId; }
    getItadGameId(): string | null { return this.itadGameId; }
    getPlaytime(): number { return this.playtime; }
    getLastPlayed(): Date | null { return this.lastPlayed; }

    setItadGameId(id: string): void { this.itadGameId = id; }
    setPlaytime(minutes: number): void { this.playtime = minutes; }
    setLastPlayed(date: Date | null): void { this.lastPlayed = date; }
}
