import { Game } from '../../entities/Game';
import { GogAuthToken } from '../../dtos/GogAuthToken';

/**
 * GOG no tiene API pública para terceros.
 *
 * Flujo OAuth2 (API no oficial — usada por Heroic, Playnite, Lutris):
 *   1. El usuario abre getAuthUrl() en el navegador
 *   2. GOG redirige a embed.gog.com/on_login_success?code=…
 *   3. La app captura el code y llama exchangeAuthCode()
 *   4. Los tokens se almacenan en Firestore; getUserGames() los usa para
 *      obtener la biblioteca via embed.gog.com/account/getFilteredProducts
 *
 * El intercambio de tokens se delega a una Cloud Function para no exponer
 * el client_secret en el bundle móvil.
 *
 * AVISO: usa API interna de GOG. Puede cambiar sin previo aviso.
 */
export interface IGogApiService {
    /** Construye la URL de autorización OAuth2 de GOG. */
    getAuthUrl(): string;

    /**
     * Intercambia un authorization code por tokens de acceso.
     * Llama a la Cloud Function gogTokenExchange para mantener el
     * client_secret fuera del bundle.
     */
    exchangeAuthCode(code: string): Promise<GogAuthToken>;

    /**
     * Renueva el access token usando el refresh token almacenado.
     * Llama a la Cloud Function gogTokenRefresh.
     */
    refreshToken(refreshToken: string): Promise<GogAuthToken>;

    /**
     * Obtiene la biblioteca de juegos del usuario autenticado.
     * Llama a embed.gog.com/account/getFilteredProducts con Bearer token.
     */
    getUserGames(accessToken: string): Promise<Game[]>;
}
