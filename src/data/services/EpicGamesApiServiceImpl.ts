import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import axios from 'axios';
import { IEpicGamesApiService } from '../../domain/interfaces/services/IEpicGamesApiService';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { EpicAuthToken } from '../../domain/dtos/EpicAuthToken';
import { Platform } from '../../domain/enums/Platform';
import {
    EPIC_GRAPHQL_URL,
    EPIC_AUTH_TOKEN_URL,
    EPIC_LIBRARY_URL,
    EPIC_CATALOG_URL,
    EPIC_AUTH_CLIENT_ID,
    EPIC_AUTH_CLIENT_SECRET,
    EPIC_AUTH_REDIRECT_URL,
} from '../config/ApiConstants';
import { TYPES } from '../../di/types';

// ─── Tipos internos ────────────────────────────────────────────────────────────

// Registro de la biblioteca del usuario (library-service)
interface EpicLibraryRecord {
    appName: string;
    catalogItemId: string;
    namespace: string;                  // El campo se llama "namespace", no "catalogNamespace"
    metadata?: EpicCatalogItem | null;  // Incluido cuando includeMetadata=true
}

// Respuesta paginada del endpoint de biblioteca
interface EpicLibraryResponse {
    records: EpicLibraryRecord[];
    responseMetadata: {
        nextCursor?: string;
    };
}

// Respuesta del endpoint de catálogo por cada item (usado como enriquecimiento adicional)
interface EpicCatalogItem {
    title: string;
    keyImages: { type: string; url: string }[];
    categories?: { path: string }[];
    mainGameItem?: unknown;
}

// Respuesta raw del endpoint de token de Epic
interface EpicTokenResponse {
    access_token: string;
    account_id: string;
    displayName: string;
    expires_at: string; // ISO 8601
}

// Forma del entitlement en el export GDPR (JSON local, sin token)
interface EpicGdprEntitlement {
    catalogItemId: string;
    namespace?: string;
    catalogNamespace?: string; // Campo alternativo presente en algunos exports
    entitlementName: string;
    itemType: string;
}

// itemTypes que definitivamente no son juegos — se excluyen en el filtro (GDPR flow).
// Usar lista negra en lugar de lista blanca porque Epic añade nuevos tipos sin avisar.
const EPIC_NON_GAME_TYPES = new Set([
    'CONSUMABLE',
    'VIRTUAL_CURRENCY',
    'SEASON_PASS',
    'BUNDLE',
    'ADD_ON',
    'DLC',
    'UNLOCKABLE',
]);

// Namespaces internos de Epic que no son juegos de la tienda
const EPIC_INTERNAL_NAMESPACES = new Set([
    'ue',   // Unreal Engine assets
]);

// Tipos de imagen preferidos del catálogo de Epic (orden de prioridad)
const EPIC_COVER_IMAGE_TYPES = [
    'OfferImageTall',
    'DieselGameBoxTall',
    'DieselStoreFrontTall',
    'OfferImageWide',
    'DieselStoreFrontWide',
];

/**
 * Flujo preferido (authorization code — API interna no oficial):
 *   1. El usuario abre EPIC_AUTH_REDIRECT_URL en el navegador e inicia sesión
 *   2. Epic muestra un authorization code de ~32 caracteres en pantalla
 *   3. exchangeAuthCode(code) → EpicAuthToken
 *   4. fetchLibrary(token) → Game[]  ← usa library-service (juegos reales de la tienda)
 *
 * Flujo alternativo (importación GDPR):
 *   1. Usuario solicita datos en epicgames.com/account/privacy (espera 24h+)
 *   2. Descarga el ZIP → extrae el JSON de entitlements
 *   3. parseExportedLibrary(fileContent) → Game[]
 *
 * Para búsqueda se usa la GraphQL pública no documentada.
 * AVISO: todos los endpoints de Epic pueden cambiar o romperse sin previo aviso.
 */
@injectable()
export class EpicGamesApiServiceImpl implements IEpicGamesApiService {

    constructor(
        @inject(TYPES.IIsThereAnyDealService)
        private readonly itadService: IIsThereAnyDealService,
    ) {}

    /**
     * Devuelve la URL que el usuario debe abrir en el navegador para iniciar sesión
     * en Epic Games y obtener el authorization code.
     */
    getAuthUrl(): string {
        return EPIC_AUTH_REDIRECT_URL;
    }

    /**
     * Intercambia un authorization code por un access token de Epic.
     *
     * El usuario obtiene el code abriendo en su navegador la URL de getAuthUrl().
     * Epic redirige a una página que muestra el code en texto plano.
     *
     * AVISO: el code expira en ~5 minutos.
     */
    async exchangeAuthCode(code: string): Promise<EpicAuthToken> {
        // Basic auth = Base64(clientId:clientSecret)
        // btoa() es la API estándar de JS — Buffer.from() es Node.js only y no existe en Hermes/JSC
        const credentials = btoa(`${EPIC_AUTH_CLIENT_ID}:${EPIC_AUTH_CLIENT_SECRET}`);

        let response;
        try {
            response = await axios.post<EpicTokenResponse>(
                EPIC_AUTH_TOKEN_URL,
                `grant_type=authorization_code&code=${encodeURIComponent(code.trim())}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `basic ${credentials}`,
                    },
                },
            );
        } catch (err: unknown) {
            // Epic devuelve 400 con body { errorCode, errorMessage } cuando el code es inválido
            const axiosErr = err as { response?: { data?: { errorMessage?: string } } };
            const epicMsg = axiosErr.response?.data?.errorMessage;
            if (epicMsg) {
                throw new Error(`Epic Games: ${epicMsg}`);
            }
            throw new Error(
                'No se pudo conectar con Epic Games. Comprueba tu conexión e inténtalo de nuevo.',
            );
        }

        const { access_token, account_id, displayName, expires_at } = response.data;
        return new EpicAuthToken(
            access_token,
            account_id,
            displayName,
            new Date(expires_at),
        );
    }

    /**
     * Obtiene la biblioteca real de juegos del usuario usando el library-service de Epic.
     * Este endpoint devuelve los juegos comprados en la Epic Games Store (no cosméticos internos).
     * Enriquece con títulos e imágenes desde el catálogo oficial si los metadatos no llegan incluidos.
     * Usa ITAD como fallback para portadas si el catálogo no tiene imagen.
     */
    async fetchLibrary(accessToken: string, _accountId: string): Promise<Game[]> {
        const records = await this.fetchAllLibraryRecords(accessToken);

        // Filtrar namespaces internos de Epic que no son juegos de la tienda
        const gameRecords = records.filter(
            r => !EPIC_INTERNAL_NAMESPACES.has(r.namespace),
        );

        // Para los registros sin metadatos, enriquecer desde el catálogo en bulk
        const recordsWithoutMeta = gameRecords.filter(r => !r.metadata?.title);
        const catalogMap = recordsWithoutMeta.length > 0
            ? await this.fetchCatalogData(recordsWithoutMeta, accessToken)
            : new Map<string, EpicCatalogItem>();

        const results = await Promise.allSettled(
            gameRecords.map(r => {
                const meta = r.metadata ?? catalogMap.get(r.catalogItemId);
                return this.mapLibraryRecordToDomain(r, meta ?? null);
            }),
        );

        return results
            .filter((r): r is PromiseFulfilledResult<Game> => r.status === 'fulfilled')
            .map(r => r.value);
    }

    async parseExportedLibrary(fileContent: string): Promise<Game[]> {
        let entitlements: EpicGdprEntitlement[] = [];
        try {
            const parsed = JSON.parse(fileContent);
            // El JSON de Epic puede tener diferentes estructuras según la versión del export
            entitlements = Array.isArray(parsed)
                ? parsed
                : (parsed.entitlements ?? parsed.data ?? []);
        } catch {
            throw new Error('El archivo no es un JSON válido de Epic Games');
        }

        // Excluir tipos que claramente no son juegos (lista negra — más permisivo que lista blanca)
        const gameEntitlements = entitlements.filter(
            e => !EPIC_NON_GAME_TYPES.has(e.itemType),
        );

        // En el flujo GDPR no hay accessToken, así que no se puede consultar el catálogo.
        // ITAD es la única fuente de portada en este flujo.
        const gamePromises = gameEntitlements.map(e => this.mapGdprEntitlementToDomain(e));
        const results = await Promise.allSettled(gamePromises);

        return results
            .filter((result): result is PromiseFulfilledResult<Game> => result.status === 'fulfilled')
            .map(result => result.value);
    }

    async searchCatalog(query: string): Promise<SearchResult[]> {
        const graphqlQuery = {
            query: `
                query searchCatalog($keywords: String!) {
                    Catalog {
                        searchStore(keywords: $keywords, category: "games/edition/base") {
                            elements {
                                id
                                title
                                keyImages { type url }
                            }
                        }
                    }
                }
            `,
            variables: { keywords: query },
        };

        try {
            const response = await axios.post(EPIC_GRAPHQL_URL, graphqlQuery, {
                headers: { 'Content-Type': 'application/json' },
            });
            const elements = response.data?.data?.Catalog?.searchStore?.elements ?? [];
            return elements.map((e: { id: string; title: string; keyImages: { type: string; url: string }[] }) => {
                const coverImage = e.keyImages?.find(
                    (img: { type: string }) => img.type === 'DieselStoreFrontWide' || img.type === 'OfferImageWide',
                );
                return new SearchResult(
                    e.id,
                    e.title,
                    coverImage?.url ?? '',
                    false,
                );
            });
        } catch {
            return [];
        }
    }

    // ─── Helpers privados ──────────────────────────────────────────────────────

    /**
     * Obtiene todos los registros de la biblioteca del usuario, paginando con cursor.
     * Endpoint: library-service.live.use1a.on.epicgames.com/library/api/public/items
     * Devuelve juegos reales comprados en la Epic Games Store.
     */
    private async fetchAllLibraryRecords(accessToken: string): Promise<EpicLibraryRecord[]> {
        const allRecords: EpicLibraryRecord[] = [];
        let cursor: string | undefined;

        do {
            const params: Record<string, string> = { includeMetadata: 'true' };
            if (cursor) params.cursor = cursor;

            let response;
            try {
                response = await axios.get<EpicLibraryResponse>(
                    `${EPIC_LIBRARY_URL}/library/api/public/items`,
                    {
                        params,
                        headers: { Authorization: `Bearer ${accessToken}` },
                    },
                );
            } catch (err: unknown) {
                const axiosErr = err as { response?: { data?: { errorMessage?: string } } };
                const epicMsg = axiosErr.response?.data?.errorMessage;
                if (epicMsg) {
                    throw new Error(`Epic Games: ${epicMsg}`);
                }
                throw new Error(
                    'No se pudo obtener tu biblioteca de Epic Games. Inténtalo de nuevo.',
                );
            }

            const { records, responseMetadata } = response.data;
            if (Array.isArray(records)) {
                allRecords.push(...records);
            }
            cursor = responseMetadata?.nextCursor;
        } while (cursor);

        return allRecords;
    }

    /**
     * Consulta el catálogo oficial de Epic en bulk (hasta 50 IDs por llamada, agrupado por namespace).
     * Devuelve un mapa catalogItemId → EpicCatalogItem con título e imágenes reales.
     * Si el catálogo no está disponible, devuelve un mapa vacío (fallback a appName).
     */
    private async fetchCatalogData(
        records: EpicLibraryRecord[],
        accessToken: string,
    ): Promise<Map<string, EpicCatalogItem>> {
        const result = new Map<string, EpicCatalogItem>();

        // Agrupar IDs por namespace (el endpoint de catálogo es por namespace)
        const byNamespace = new Map<string, string[]>();
        for (const r of records) {
            if (!byNamespace.has(r.namespace)) {
                byNamespace.set(r.namespace, []);
            }
            byNamespace.get(r.namespace)!.push(r.catalogItemId);
        }

        // Procesar cada namespace en lotes de 50
        const BATCH_SIZE = 50;
        const namespaceRequests: Promise<void>[] = [];

        for (const [namespace, ids] of byNamespace) {
            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                const batch = ids.slice(i, i + BATCH_SIZE);
                namespaceRequests.push(
                    this.fetchCatalogBatch(namespace, batch, accessToken, result),
                );
            }
        }

        // Ejecutar todas las peticiones en paralelo — si alguna falla, se ignora
        await Promise.allSettled(namespaceRequests);

        return result;
    }

    /**
     * Obtiene un lote de items del catálogo para un namespace específico.
     * Escribe los resultados directamente en el mapa compartido `result`.
     */
    private async fetchCatalogBatch(
        namespace: string,
        ids: string[],
        accessToken: string,
        result: Map<string, EpicCatalogItem>,
    ): Promise<void> {
        // El endpoint acepta múltiples ?id= en la query string
        const params = new URLSearchParams();
        for (const id of ids) {
            params.append('id', id);
        }
        params.append('country', 'US');
        params.append('locale', 'es-ES');

        let response;
        try {
            response = await axios.get<Record<string, EpicCatalogItem>>(
                `${EPIC_CATALOG_URL}/${namespace}/bulk/items`,
                {
                    params,
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
            );
        } catch {
            // Si el catálogo no está disponible para este namespace, ignorar silenciosamente
            return;
        }

        const data = response.data ?? {};
        for (const [catalogItemId, item] of Object.entries(data)) {
            if (item?.title) {
                result.set(catalogItemId, item);
            }
        }
    }

    /**
     * Extrae la mejor URL de portada disponible de los keyImages del catálogo.
     * Prioriza imágenes verticales (formato 2:3) sobre horizontales.
     */
    private extractCoverUrl(keyImages: { type: string; url: string }[]): string {
        for (const preferredType of EPIC_COVER_IMAGE_TYPES) {
            const image = keyImages.find(img => img.type === preferredType);
            if (image?.url) return image.url;
        }
        // Fallback: primera imagen disponible
        return keyImages[0]?.url ?? '';
    }

    /**
     * Mapper: EpicLibraryRecord → Game de dominio.
     * Usa los metadatos del library-service si están disponibles,
     * con fallback al catálogo y luego a ITAD para la portada.
     */
    private async mapLibraryRecordToDomain(
        record: EpicLibraryRecord,
        catalogItem: EpicCatalogItem | null,
    ): Promise<Game> {
        // Título: metadatos del library-service > catálogo > appName del registro
        const title = record.metadata?.title ?? catalogItem?.title ?? record.appName;

        // Portada: intentar metadatos/catálogo primero, luego ITAD
        const keyImages = record.metadata?.keyImages ?? catalogItem?.keyImages ?? [];
        let coverUrl = keyImages.length > 0 ? this.extractCoverUrl(keyImages) : '';
        let itadGameId: string | null = null;

        if (!coverUrl) {
            try {
                const itadId = await this.itadService.lookupGameId(title);
                if (itadId) {
                    itadGameId = itadId;
                    try {
                        const gameInfo = await this.itadService.getGameInfo(itadId);
                        if (gameInfo?.coverUrl) {
                            coverUrl = gameInfo.coverUrl;
                        }
                    } catch {
                        // Si getGameInfo falla, mantener itadGameId e coverUrl vacío
                    }
                }
            } catch {
                // Si ITAD está indisponible, crear el Game sin estos datos
            }
        } else {
            // Tenemos portada — buscar itadGameId en paralelo sin bloquear la imagen
            try {
                const itadId = await this.itadService.lookupGameId(title);
                if (itadId) itadGameId = itadId;
            } catch {
                // itadGameId queda null — no es crítico para mostrar el juego
            }
        }

        return new Game(
            record.catalogItemId,
            title,
            '',
            coverUrl,
            Platform.EPIC_GAMES,
            null, // No hay Steam AppID para juegos de Epic
            itadGameId,
        );
    }

    /**
     * Mapper: EpicGdprEntitlement → Game de dominio (flujo GDPR, sin accessToken).
     * Sin acceso al catálogo — solo ITAD para portada.
     */
    private async mapGdprEntitlementToDomain(
        entitlement: EpicGdprEntitlement,
    ): Promise<Game> {
        const title = entitlement.entitlementName;
        let coverUrl = '';
        let itadGameId: string | null = null;

        try {
            const itadId = await this.itadService.lookupGameId(title);
            if (itadId) {
                itadGameId = itadId;
                try {
                    const gameInfo = await this.itadService.getGameInfo(itadId);
                    if (gameInfo?.coverUrl) {
                        coverUrl = gameInfo.coverUrl;
                    }
                } catch {
                    // Si getGameInfo falla, mantener itadGameId e coverUrl vacío
                }
            }
        } catch {
            // Si ITAD está indisponible, crear el Game sin estos datos
        }

        return new Game(
            entitlement.catalogItemId,
            title,
            '',
            coverUrl,
            Platform.EPIC_GAMES,
            null,
            itadGameId,
        );
    }
}
