import { DocumentData } from 'firebase/firestore';
import { WishlistItem } from '../../domain/entities/WishlistItem';

/**
 * Mapper bidireccional entre documentos Firestore y la entidad WishlistItem.
 * Se usa en WishlistRepositoryImpl.
 *
 * Estructura del documento Firestore (users/{userId}/wishlist/{itemId}):
 * {
 *   gameId: string,
 *   title: string,
 *   coverUrl: string,
 *   addedAt: string (ISO 8601),
 *   bestDealPercentage: number | null,
 * }
 */
export class FirestoreWishlistMapper {

    static toDomain(docId: string, data: DocumentData): WishlistItem {
        return new WishlistItem(
            docId,
            data.gameId ?? '',
            data.title ?? '',
            data.coverUrl ?? '',
            data.addedAt ? new Date(data.addedAt) : new Date(),
            data.bestDealPercentage ?? null,
        );
    }

    static toFirestore(item: WishlistItem): Record<string, unknown> {
        return {
            gameId: item.getGameId(),
            title: item.getTitle(),
            coverUrl: item.getCoverUrl(),
            addedAt: item.getAddedAt().toISOString(),
            bestDealPercentage: item.getBestDealPercentage(),
        };
    }
}
