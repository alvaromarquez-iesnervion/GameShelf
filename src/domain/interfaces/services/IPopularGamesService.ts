import { Game } from '../../entities/Game';

/**
 * Abstracción de dominio para obtener juegos populares.
 * Oculta el detalle de implementación (Steam) al HomeUseCase.
 */
export interface IPopularGamesService {
    /** Devuelve los juegos más jugados globalmente. */
    getMostPlayedGames(limit?: number): Promise<Game[]>;
    /** Devuelve los juegos jugados recientemente por un usuario de Steam. */
    getRecentlyPlayedGames(steamId: string): Promise<Game[]>;
}
