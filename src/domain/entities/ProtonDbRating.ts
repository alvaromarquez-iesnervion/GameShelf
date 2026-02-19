export class ProtonDbRating {

    private tier: string;
    private trendingTier: string;
    private total: number;

    constructor(tier: string, trendingTier: string, total: number) {
        this.tier = tier;
        this.trendingTier = trendingTier;
        this.total = total;
    }

    // Rating general actual. Valores en minúsculas: "platinum" | "gold" | "silver" | "bronze" | "borked" | "pending"
    getTier(): string { return this.tier; }
    // Rating basado en reports recientes. Más actualizado que tier.
    getTrendingTier(): string { return this.trendingTier; }
    // Número total de reports de la comunidad
    getTotal(): number { return this.total; }
}
