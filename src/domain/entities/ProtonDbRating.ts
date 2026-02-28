export type ProtonTier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'borked' | 'pending';

export class ProtonDbRating {

    private tier: ProtonTier;
    private trendingTier: ProtonTier;
    private total: number;

    constructor(tier: ProtonTier, trendingTier: ProtonTier, total: number) {
        this.tier = tier;
        this.trendingTier = trendingTier;
        this.total = total;
    }

    // Rating general actual
    getTier(): ProtonTier { return this.tier; }
    // Rating basado en reports recientes. Más actualizado que tier.
    getTrendingTier(): ProtonTier { return this.trendingTier; }
    // Número total de reports de la comunidad
    getTotal(): number { return this.total; }
}
