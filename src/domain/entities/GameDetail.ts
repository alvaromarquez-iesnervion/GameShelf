import { Game } from './Game';
import { Deal } from './Deal';

export class GameDetail {

    private game: Game;
    private protonDbRating: string | null;
    private protonDbTrendingRating: string | null;
    private howLongToBeatMain: number | null;
    private howLongToBeatMainExtra: number | null;
    private howLongToBeatCompletionist: number | null;
    private deals: Deal[];

    constructor(
        game: Game,
        protonDbRating: string | null,
        protonDbTrendingRating: string | null,
        howLongToBeatMain: number | null,
        howLongToBeatMainExtra: number | null,
        howLongToBeatCompletionist: number | null,
        deals: Deal[],
    ) {
        this.game = game;
        this.protonDbRating = protonDbRating;
        this.protonDbTrendingRating = protonDbTrendingRating;
        this.howLongToBeatMain = howLongToBeatMain;
        this.howLongToBeatMainExtra = howLongToBeatMainExtra;
        this.howLongToBeatCompletionist = howLongToBeatCompletionist;
        this.deals = deals;
    }

    getGame(): Game { return this.game; }
    // Valores posibles: "platinum" | "gold" | "silver" | "bronze" | "borked" | null
    getProtonDbRating(): string | null { return this.protonDbRating; }
    getProtonDbTrendingRating(): string | null { return this.protonDbTrendingRating; }
    // Horas decimales (ej: 52.5). null si la API de HLTB falla o no hay datos.
    getHowLongToBeatMain(): number | null { return this.howLongToBeatMain; }
    getHowLongToBeatMainExtra(): number | null { return this.howLongToBeatMainExtra; }
    getHowLongToBeatCompletionist(): number | null { return this.howLongToBeatCompletionist; }
    getDeals(): Deal[] { return this.deals; }
}
