import { Platform } from '../enums/Platform';
import { GameType } from '../enums/GameType';

export class Game {

    private id: string;
    private title: string;
    private description: string;
    private coverUrl: string;
    private portraitCoverUrl: string;
    private platform: Platform;
    private steamAppId: number | null;
    private itadGameId: string | null;
    private psnTitleId: string | null;
    private playtime: number;
    private lastPlayed: Date | null;
    private gameType: GameType;
    private parentGameId: string | null;

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
        gameType: GameType = GameType.GAME,
        parentGameId: string | null = null,
        psnTitleId: string | null = null,
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.coverUrl = coverUrl;
        this.portraitCoverUrl = portraitCoverUrl;
        this.platform = platform;
        this.steamAppId = steamAppId;
        this.itadGameId = itadGameId;
        this.psnTitleId = psnTitleId;
        this.playtime = playtime;
        this.lastPlayed = lastPlayed;
        this.gameType = gameType;
        this.parentGameId = parentGameId;
    }

    getId(): string { return this.id; }
    getTitle(): string { return this.title; }
    getDescription(): string { return this.description; }
    getCoverUrl(): string { return this.coverUrl; }
    getPortraitCoverUrl(): string { return this.portraitCoverUrl; }
    getPlatform(): Platform { return this.platform; }
    getSteamAppId(): number | null { return this.steamAppId; }
    getItadGameId(): string | null { return this.itadGameId; }
    getPsnTitleId(): string | null { return this.psnTitleId; }
    getPlaytime(): number { return this.playtime; }
    getLastPlayed(): Date | null { return this.lastPlayed; }
    getGameType(): GameType { return this.gameType; }
    getParentGameId(): string | null { return this.parentGameId; }

    withItadGameId(id: string): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, id, this.playtime, this.lastPlayed, this.portraitCoverUrl, this.gameType, this.parentGameId, this.psnTitleId);
    }
    withSteamAppId(id: number): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, id, this.itadGameId, this.playtime, this.lastPlayed, this.portraitCoverUrl, this.gameType, this.parentGameId, this.psnTitleId);
    }
    withPsnTitleId(id: string): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, this.itadGameId, this.playtime, this.lastPlayed, this.portraitCoverUrl, this.gameType, this.parentGameId, id);
    }
    withPlaytime(minutes: number): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, this.itadGameId, minutes, this.lastPlayed, this.portraitCoverUrl, this.gameType, this.parentGameId, this.psnTitleId);
    }
    withLastPlayed(date: Date | null): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, this.itadGameId, this.playtime, date, this.portraitCoverUrl, this.gameType, this.parentGameId, this.psnTitleId);
    }
    withGameType(type: GameType): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, this.itadGameId, this.playtime, this.lastPlayed, this.portraitCoverUrl, type, this.parentGameId, this.psnTitleId);
    }
    withParentGameId(id: string): Game {
        return new Game(this.id, this.title, this.description, this.coverUrl, this.platform, this.steamAppId, this.itadGameId, this.playtime, this.lastPlayed, this.portraitCoverUrl, this.gameType, id, this.psnTitleId);
    }
}
