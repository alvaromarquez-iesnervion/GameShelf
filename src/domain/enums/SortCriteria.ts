/**
 * Criterios de ordenación disponibles para la biblioteca de juegos.
 * Reside en domain porque es un concepto de negocio agnóstico de UI.
 */
export enum SortCriteria {
    /** A → Z por título */
    ALPHABETICAL = 'ALPHABETICAL',
    /** Más reciente primero según lastPlayed */
    LAST_PLAYED = 'LAST_PLAYED',
    /** Mayor tiempo jugado primero */
    PLAYTIME = 'PLAYTIME',
}
