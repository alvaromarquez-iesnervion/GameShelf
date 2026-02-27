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
    EPIC_ENTITLEMENTS_URL,
    EPIC_CATALOG_URL,
    EPIC_AUTH_CLIENT_ID,
    EPIC_AUTH_CLIENT_SECRET,
    EPIC_AUTH_REDIRECT_URL,
} from '../config/ApiConstants';
import { TYPES } from '../../di/types';

// ─── Tipos internos ────────────────────────────────────────────────────────────

// Estructura del JSON de entitlements (GDPR export y API de entitlements comparten el mismo shape)
interface EpicEntitlement {
    catalogItemId: string;
    catalogNamespace: string;
    entitlementName: string;
    itemType: string;
}

// Respuesta del endpoint de catálogo por cada item
interface EpicCatalogItem {
    title: string;
    keyImages: { type: string; url: string }[];
}

// Respuesta raw del endpoint de token de Epic
interface EpicTokenResponse {
    access_token: string;
    account_id: string;
    displayName: string;
    expires_at: string; // ISO 8601
}

// itemTypes que definitivamente no son juegos — se excluyen en el filtro.
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
 *   4. fetchLibrary(token) → Game[]
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
     * Obtiene la biblioteca de entitlements del usuario autenticado.
     * Enriquece con títulos e imágenes desde el catálogo oficial de Epic (requiere accessToken).
     * Usa ITAD como fallback para portadas si el catálogo no tiene imagen.
     */
    async fetchLibrary(accessToken: string, accountId: string): Promise<Game[]> {
        let entitlements: EpicEntitlement[] = [];
        try {
            const response = await axios.get<EpicEntitlement[]>(
                `${EPIC_ENTITLEMENTS_URL}/${accountId}/entitlements`,
                {
                    params: { count: 5000 },
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
            );
            entitlements = Array.isArray(response.data) ? response.data : [];
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

        const gameEntitlements = entitlements.filter(
            e => !EPIC_NON_GAME_TYPES.has(e.itemType),
        );

        // Obtener títulos e imágenes reales desde el catálogo de Epic (bulk, agrupado por namespace)
        const catalogMap = await this.fetchCatalogData(gameEntitlements, accessToken);

        const results = await Promise.allSettled(
            gameEntitlements.map(e => this.mapEpicEntitlementToDomain(e, catalogMap.get(e.catalogItemId))),
        );

        return results
            .filter((r): r is PromiseFulfilledResult<Game> => r.status === 'fulfilled')
            .map(r => r.value);
    }

    async parseExportedLibrary(fileContent: string): Promise<Game[]> {
        let entitlements: EpicEntitlement[] = [];
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
        const gamePromises = gameEntitlements.map(e => this.mapEpicEntitlementToDomain(e));
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
     * Consulta el catálogo oficial de Epic en bulk (hasta 50 IDs por llamada, agrupado por namespace).
     * Devuelve un mapa catalogItemId → EpicCatalogItem con título e imágenes reales.
     * Si el catálogo no está disponible, devuelve un mapa vacío (fallback a entitlementName).
     */
    private async fetchCatalogData(
        entitlements: EpicEntitlement[],
        accessToken: string,
    ): Promise<Map<string, EpicCatalogItem>> {
        const result = new Map<string, EpicCatalogItem>();

        // Agrupar IDs por namespace (el endpoint de catálogo es por namespace)
        const byNamespace = new Map<string, string[]>();
        for (const e of entitlements) {
            if (!byNamespace.has(e.catalogNamespace)) {
                byNamespace.set(e.catalogNamespace, []);
            }
            byNamespace.get(e.catalogNamespace)!.push(e.catalogItemId);
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

        const response = await axios.get<Record<string, EpicCatalogItem>>(
            `${EPIC_CATALOG_URL}/${namespace}/bulk/items`,
            {
                params,
                headers: { Authorization: `Bearer ${accessToken}` },
            },
        );

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
     * Mapper interno: EpicEntitlement → Game de dominio.
     *
     * Fuentes de datos en orden de prioridad:
     *   1. Catálogo de Epic (título real + portada) — solo disponible en flujo auth code
     *   2. ITAD (portada) — fallback si el catálogo no tiene imagen o no está disponible
     *   3. entitlementName — fallback de título si el catálogo no está disponible
     */
    private async mapEpicEntitlementToDomain(
        entitlement: EpicEntitlement,
        catalogItem?: EpicCatalogItem,
    ): Promise<Game> {
        // Título: usar el del catálogo si está disponible, si no entitlementName
        const title = catalogItem?.title ?? entitlement.entitlementName;

        // Portada: intentar catálogo primero, luego ITAD
        let coverUrl = catalogItem ? this.extractCoverUrl(catalogItem.keyImages) : '';
        let itadGameId: string | null = null;

        // Si el catálogo no tiene imagen (o no estaba disponible), intentar ITAD
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
                        // Si getGameInfo falla, mantener itadGameId igual y coverUrl vacío
                    }
                }
            } catch {
                // Si ITAD está indisponible, crear el Game sin estos datos
            }
        } else {
            // El catálogo tiene imagen — buscar itadGameId en paralelo sin bloquear
            try {
                const itadId = await this.itadService.lookupGameId(title);
                if (itadId) itadGameId = itadId;
            } catch {
                // itadGameId queda null — no es crítico para mostrar el juego
            }
        }

        return new Game(
            entitlement.catalogItemId,
            title,
            '',
            coverUrl,
            Platform.EPIC_GAMES,
            null, // No hay Steam AppID para juegos de Epic
            itadGameId,
        );
    }
}
