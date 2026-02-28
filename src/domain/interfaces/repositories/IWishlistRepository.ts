import { WishlistItem } from '../../entities/WishlistItem';

export interface IWishlistRepository {
    getWishlist(userId: string): Promise<WishlistItem[]>;
    addToWishlist(userId: string, item: WishlistItem): Promise<void>;
    removeFromWishlist(userId: string, itemId: string): Promise<void>;
    /** Usado en búsqueda y detalle para marcar el flag isInWishlist. */
    isInWishlist(userId: string, gameId: string): Promise<boolean>;
    /** Retorna Set de gameIds en la wishlist. Más eficiente para batch checks. */
    getWishlistGameIds(userId: string): Promise<Set<string>>;
}
