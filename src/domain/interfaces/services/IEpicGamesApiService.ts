import { Game } from '../../entities/Game';
import { SearchResult } from '../../entities/SearchResult';
import { EpicAuthToken } from '../../dtos/EpicAuthToken';

/**
 * Epic NO tiene API pública de biblioteca para terceros.
 *
 * Flujo preferido (authorization code — API no oficial):
 *   1. El usuario abre EPIC_AUTH_REDIRECT_URL en el navegador e inicia sesión
 *   2. Epic muestra un authorization code de ~32 caracteres en pantalla
 *   3. El usuario copia el código y lo pega en la app → exchangeAuthCode()
 *   4. Con el token resultante se obtiene la biblioteca → fetchLibrary()
 *
 * Flujo alternativo (importación manual GDPR):
 *   1. Usuario solicita sus datos en epicgames.com/account/privacy (espera 24h–varios días)
 *   2. Descarga el ZIP, extrae el JSON de entitlements
 *   3. Sube el JSON a la app → parseExportedLibrary()
 *
 * Para búsqueda en catálogo: GraphQL no oficial (puede cambiar sin aviso).
 *
 * AVISO: los endpoints de auth y entitlements son API interna de Epic.
 * Pueden cambiar o dejar de funcionar sin previo aviso.
 */
export interface IEpicGamesApiService {
    /**
     * Intercambia un authorization code de Epic por un access token.
     * El authorization code se obtiene abriendo EPIC_AUTH_REDIRECT_URL en el navegador.
     * AVISO: el code expira en ~5 minutos.
     */
    exchangeAuthCode(code: string): Promise<EpicAuthToken>;

    /**
     * Obtiene la biblioteca de entitlements del usuario autenticado.
     * Requiere un EpicAuthToken válido obtenido con exchangeAuthCode().
     * Devuelve los juegos del usuario con plataforma EPIC_GAMES.
     */
    fetchLibrary(accessToken: string, accountId: string): Promise<Game[]>;

    /** Parsea el JSON del export GDPR de Epic. Devuelve los juegos encontrados. */
    parseExportedLibrary(fileContent: string): Promise<Game[]>;

    /** Búsqueda en catálogo público de Epic via GraphQL no oficial. */
    searchCatalog(query: string): Promise<SearchResult[]>;
}
