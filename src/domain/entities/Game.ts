import { Platform } from '../enums/Platform';

export class Game {

    private id: string;
    private title: string;
    private description: string;
    private coverUrl: string;
    private platform: Platform;
    private steamAppId: number | null;
    private itadGameId: string | null;

    constructor(
        id: string,
        title: string,
        description: string,
        coverUrl: string,
        platform: Platform,
        steamAppId: number | null,
        itadGameId: string | null,
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.coverUrl = coverUrl;
        this.platform = platform;
        this.steamAppId = steamAppId;
        this.itadGameId = itadGameId;
    }

    getId(): string { return this.id; }
    getTitle(): string { return this.title; }
    getDescription(): string { return this.description; }
    getCoverUrl(): string { return this.coverUrl; }
    getPlatform(): Platform { return this.platform; }
    getSteamAppId(): number | null { return this.steamAppId; }
    getItadGameId(): string | null { return this.itadGameId; }

    // Se actualiza la primera vez que se consulta ITAD para cachear el UUID
    setItadGameId(id: string): void { this.itadGameId = id; }
}
