/**
 * Available sort criteria for the game library.
 * Lives in domain because it is a UI-agnostic business concept.
 */
export enum SortCriteria {
    /** A → Z by title */
    ALPHABETICAL = 'ALPHABETICAL',
    /** Most recently played first, by lastPlayed */
    LAST_PLAYED = 'LAST_PLAYED',
    /** Highest playtime first */
    PLAYTIME = 'PLAYTIME',
}
