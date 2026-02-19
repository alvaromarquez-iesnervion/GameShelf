import { Game } from '../../entities/Game';
import { SearchResult } from '../../entities/SearchResult';

/**
 * Epic NO tiene API pública de biblioteca para terceros.
 *
 * Flujo de importación:
 *   1. Usuario solicita sus datos en epicgames.com/account/privacy (espera 24h–varios días)
 *   2. Descarga el ZIP, extrae el JSON de entitlements
 *   3. Sube el JSON a la app → parseExportedLibrary()
 *
 * Para búsqueda en catálogo: GraphQL no oficial (puede cambiar sin aviso).
 */
export interface IEpicGamesApiService {
    /** Parsea el JSON del export GDPR de Epic. Devuelve los juegos encontrados. */
    parseExportedLibrary(fileContent: string): Promise<Game[]>;
    /** Búsqueda en catálogo público de Epic via GraphQL no oficial. */
    searchCatalog(query: string): Promise<SearchResult[]>;
}
