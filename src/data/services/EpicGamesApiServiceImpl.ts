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
    EPIC_AUTH_CLIENT_ID,
    EPIC_AUTH_CLIENT_SECRET,
    EPIC_AUTH_REDIRECT_URL,
} from '../config/ApiConstants';
import { TYPES } from '../../di/types';

// Estructura del JSON de entitlements (GDPR export y API de entitlements comparten el mismo shape)
interface EpicEntitlement {
    catalogItemId: string;
    catalogNamespace: string;
    entitlementName: string;
    itemType: string;
}

// Respuesta raw del endpoint de token de Epic
interface EpicTokenResponse {
    access_token: string;
    account_id: string;
    displayName: string;
    expires_at: string; // ISO 8601
}

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
        const credentials = Buffer.from(
            `${EPIC_AUTH_CLIENT_ID}:${EPIC_AUTH_CLIENT_SECRET}`,
        ).toString('base64');

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
     * Filtra los mismos itemType que parseExportedLibrary (EXECUTABLE / DURABLE_ENTITLEMENT)
     * y enriquece con ITAD exactamente igual que el flujo GDPR.
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
            e => e.itemType === 'EXECUTABLE' || e.itemType === 'DURABLE_ENTITLEMENT',
        );

        const results = await Promise.allSettled(
            gameEntitlements.map(e => this.mapEpicEntitlementToDomain(e)),
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

        // Filtrar solo juegos (itemType === 'EXECUTABLE' o 'DURABLE_ENTITLEMENT')
        const gameEntitlements = entitlements.filter(
            e => e.itemType === 'EXECUTABLE' || e.itemType === 'DURABLE_ENTITLEMENT',
        );

        // Mapear a Game y enriquecer con datos de ITAD (portadas e itadGameId)
        // Usar Promise.allSettled para que si una API falla, las demás sigan funcionando
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

    /**
     * Mapper interno: EpicEntitlement → Game de dominio.
     * Enriquece con portada e itadGameId desde ITAD.
     * Si las búsquedas fallan, devuelve Game con datos básicos.
     */
    private async mapEpicEntitlementToDomain(entitlement: EpicEntitlement): Promise<Game> {
        let coverUrl = '';
        let itadGameId: string | null = null;

        try {
            // Intentar obtener portada y itadGameId desde ITAD usando el título
            // Usar esta API como fallback si la búsqueda directa falla
            const itadId = await this.itadService.lookupGameId(entitlement.entitlementName);
            if (itadId) {
                itadGameId = itadId;
                // Intentar obtener la URL de portada desde ITAD
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
            // Es preferible tener el juego sin portada que perder la sincronización
        }

        return new Game(
            entitlement.catalogItemId,
            entitlement.entitlementName,
            '',
            coverUrl, // URL de portada desde ITAD, si está disponible
            Platform.EPIC_GAMES,
            null, // No hay Steam AppID para juegos de Epic
            itadGameId,
        );
    }
}
