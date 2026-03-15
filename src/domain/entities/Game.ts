import { Platform } from '../enums/Platform';

export class Game {

    private id: string;
    private title: string;
    private description: string;
    private coverUrl: string;
    private portraitCoverUrl: string;
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
        portraitCoverUrl: string = '',
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.coverUrl = coverUrl;
        this.portraitCoverUrl = portraitCoverUrl;
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
    getPortraitCoverUrl(): string { return this.portraitCoverUrl; }
    getPlatform(): Platform { return this.platform; }
    getSteamAppId(): number | null { return this.steamAppId; }
    getItadGameId(): string | null { return this.itadGameId; }
    getPlaytime(): number { return this.playtime; }
    getLastPlayed(): Date | null { return this.lastPlayed; }

    withItadGameId(id: string): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, id, this.playtime, this.lastPlayed, this.portraitCoverUrl);
    }
    withSteamAppId(id: number): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, id, this.itadGameId, this.playtime, this.lastPlayed, this.portraitCoverUrl);
    }
    withPlaytime(minutes: number): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, this.itadGameId, minutes, this.lastPlayed, this.portraitCoverUrl);
    }
    withLastPlayed(date: Date | null): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, this.itadGameId, this.playtime, date, this.portraitCoverUrl);
    }
}
