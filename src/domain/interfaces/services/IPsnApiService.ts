import { Game } from '../../entities/Game';
import { PsnAuthToken } from '../../dtos/PsnAuthToken';

/**
 * PSN no tiene API pública para terceros.
 *
 * Flujo OAuth via ASWebAuthenticationSession:
 *   1. authenticateWithBrowser() abre Safari real con la URL OAuth de Sony
 *   2. El usuario inicia sesión (passkeys funcionan)
 *   3. Sony redirige a un custom scheme con un access code
 *   4. exchangeCodeForTokens() convierte el code en access + refresh tokens
 *   5. fetchPlayedGames() obtiene los juegos jugados del usuario
 *
 * El access token dura pocas horas; el refresh token ~2 meses.
 * Cuando el refresh token expira, el usuario debe volver a vincular su cuenta.
 *
 * AVISO: usa endpoints internos de PSN. Puede cambiar sin previo aviso.
 */
export interface IPsnApiService {
    /** Devuelve la URL OAuth de PlayStation. */
    getPsnLoginUrl(): string;

    /**
     * Abre el navegador del sistema (ASWebAuthenticationSession) para que el
     * usuario inicie sesión en PSN. Devuelve el access code del redirect.
     */
    authenticateWithBrowser(): Promise<string>;

    /**
     * Intercambia un access code por tokens de acceso (access + refresh).
     */
    exchangeNpssoForTokens(accessCode: string): Promise<PsnAuthToken>;

    /**
     * Renueva el access token usando el refresh token almacenado.
     * Si el refresh token ha expirado, lanza un error y el usuario debe re-vincular.
     */
    refreshToken(refreshToken: string): Promise<PsnAuthToken>;

    /**
     * Obtiene la lista de juegos jugados del usuario autenticado.
     * Solo devuelve juegos que hayan sido iniciados al menos una vez.
     * Incluye PS4, PS5 y juegos de PC vía PlayStation.
     */
    fetchPlayedGames(accessToken: string): Promise<Game[]>;
}
