import { Game } from './Game';
import { Deal } from './Deal';
import { SteamGameMetadata } from '../dtos/SteamGameMetadata';

export class GameDetail {

    private game: Game;
    private protonDbRating: string | null;
    private protonDbTrendingRating: string | null;
    private protonDbReportCount: number | null;
    private howLongToBeatMain: number | null;
    private howLongToBeatMainExtra: number | null;
    private howLongToBeatCompletionist: number | null;
    private deals: Deal[];
    private steamMetadata: SteamGameMetadata | null;

    constructor(
        game: Game,
        protonDbRating: string | null,
        protonDbTrendingRating: string | null,
        protonDbReportCount: number | null,
        howLongToBeatMain: number | null,
        howLongToBeatMainExtra: number | null,
        howLongToBeatCompletionist: number | null,
        deals: Deal[],
        steamMetadata: SteamGameMetadata | null,
    ) {
        this.game = game;
        this.protonDbRating = protonDbRating;
        this.protonDbTrendingRating = protonDbTrendingRating;
        this.protonDbReportCount = protonDbReportCount;
        this.howLongToBeatMain = howLongToBeatMain;
        this.howLongToBeatMainExtra = howLongToBeatMainExtra;
        this.howLongToBeatCompletionist = howLongToBeatCompletionist;
        this.deals = deals;
        this.steamMetadata = steamMetadata;
    }

    getGame(): Game { return this.game; }
    // Valores posibles: "platinum" | "gold" | "silver" | "bronze" | "borked" | null
    getProtonDbRating(): string | null { return this.protonDbRating; }
    getProtonDbTrendingRating(): string | null { return this.protonDbTrendingRating; }
    /** Total community reports on ProtonDB. null if ProtonDB did not return data. */
    getProtonDbReportCount(): number | null { return this.protonDbReportCount; }
    // Horas decimales (ej: 52.5). null si la API de HLTB falla o no hay datos.
    getHowLongToBeatMain(): number | null { return this.howLongToBeatMain; }
    getHowLongToBeatMainExtra(): number | null { return this.howLongToBeatMainExtra; }
    getHowLongToBeatCompletionist(): number | null { return this.howLongToBeatCompletionist; }
    getDeals(): Deal[] { return this.deals; }
    /** Steam Store metadata (genres, devs, publishers, Metacritic, screenshots, recommendations). */
    getSteamMetadata(): SteamGameMetadata | null { return this.steamMetadata; }
}
