/**
 * Metadata enriched from the Steam Store API (appdetails endpoint).
 * Fetched on-demand when opening GameDetailScreen for a Steam game.
 * Fields are nullable — some games (e.g. DLC, legacy titles) may omit them.
 */
export interface SteamGameMetadata {
    /** e.g. ["Action", "RPG", "Open World"] */
    genres: string[];
    /** e.g. ["Valve", "CD PROJEKT RED"] */
    developers: string[];
    /** e.g. ["Valve"] */
    publishers: string[];
    /** Human-readable release date string from Steam, e.g. "21 Nov, 2011". null if coming_soon. */
    releaseDate: string | null;
    /** Metacritic score 0–100, or null if Steam does not have one for this game. */
    metacriticScore: number | null;
    /** Direct Metacritic URL for the game, or null. */
    metacriticUrl: string | null;
    /** Full-resolution screenshot URLs, ordered as they appear on the Steam page. */
    screenshots: string[];
    /** Total number of positive Steam user recommendations. */
    recommendationCount: number | null;
}
