import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import axios from 'axios';
import { IEpicGamesApiService } from '../../domain/interfaces/services/IEpicGamesApiService';
import { IIsThereAnyDealService } from '../../domain/interfaces/services/IIsThereAnyDealService';
import { Game } from '../../domain/entities/Game';
import { SearchResult } from '../../domain/entities/SearchResult';
import { Platform } from '../../domain/enums/Platform';
import { EPIC_GRAPHQL_URL } from '../config/ApiConstants';
import { TYPES } from '../../di/types';

// Estructura del JSON de entitlements en el export GDPR de Epic
interface EpicEntitlement {
    catalogItemId: string;
    catalogNamespace: string;
    entitlementName: string;
    itemType: string;
}

/**
 * Epic NO ofrece API de biblioteca para apps de terceros.
 * Flujo de importación:
 *   1. Usuario solicita datos en epicgames.com/account/privacy (espera 24h+)
 *   2. Descarga el ZIP → extrae el JSON de entitlements
 *   3. Sube el JSON a la app → parseExportedLibrary()
 *
 * Para búsqueda se usa la GraphQL pública no documentada.
 * AVISO: puede cambiar o romperse sin previo aviso.
 */
@injectable()
export class EpicGamesApiServiceImpl implements IEpicGamesApiService {

    constructor(
        @inject(TYPES.IIsThereAnyDealService)
        private readonly itadService: IIsThereAnyDealService,
    ) {}

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
