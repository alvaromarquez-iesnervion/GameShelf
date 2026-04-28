import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IWishlistUseCase } from '../../domain/interfaces/usecases/wishlist/IWishlistUseCase';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { TYPES } from '../../di/types';
import { withLoading } from './BaseViewModel';
import { UserPreferencesStore } from '../../data/utils/UserPreferencesStore';

/**
 * ViewModel para la wishlist.
 *
 * Singleton: compartido entre SearchScreen y GameDetailScreen para mantener consistencia.
 */
@injectable()
export class WishlistViewModel {
    private _items: WishlistItem[] = [];
    private _isLoading: boolean = false;
    private _errorMessage: string | null = null;
    // Track current userId for reactive reload when country changes.
    private _currentUserId: string = '';

    constructor(
        @inject(TYPES.IWishlistUseCase)
        private readonly wishlistUseCase: IWishlistUseCase,
        @inject(TYPES.UserPreferencesStore)
        private readonly userPrefs: UserPreferencesStore,
    ) {
        makeAutoObservable(this);
    }

    get items(): WishlistItem[] {
        return this._items;
    }

    get isLoading(): boolean {
        return this._isLoading;
    }

    get errorMessage(): string | null {
        return this._errorMessage;
    }

    async loadWishlist(userId: string): Promise<void> {
        this._currentUserId = userId;
        await withLoading(this, '_isLoading', '_errorMessage', async () => {
            const country = this.userPrefs.effectiveCountry;
            const items = await this.wishlistUseCase.getWishlist(userId, country);
            runInAction(() => {
                this._items = items;
            });
        });
    }

    /** Recarga la wishlist usando el userId actual con la moneda del país efectivo. */
    async reloadWithCountry(): Promise<void> {
        if (!this._currentUserId) return;
        await this.loadWishlist(this._currentUserId);
    }

    async addToWishlist(userId: string, item: WishlistItem): Promise<boolean> {
        const result = await withLoading(this, '_isLoading', '_errorMessage', async () => {
            await this.wishlistUseCase.addToWishlist(userId, item);
            // Recargar la lista para obtener datos actualizados
            await this.loadWishlist(userId);
            return true;
        });
        return result ?? false;
    }

    async removeFromWishlist(userId: string, itemId: string): Promise<boolean> {
        const result = await withLoading(this, '_isLoading', '_errorMessage', async () => {
            await this.wishlistUseCase.removeFromWishlist(userId, itemId);
            // Actualizar la lista local sin recargar
            runInAction(() => {
                this._items = this._items.filter(item => item.getId() !== itemId);
            });
            return true;
        });
        return result ?? false;
    }

    isGameInWishlist(gameId: string): boolean {
        return this._items.some(item => item.getGameId() === gameId);
    }

    /** Limpia todo el estado al cerrar sesión para que el siguiente usuario empiece limpio. */
    reset(): void {
        runInAction(() => {
            this._items = [];
            this._isLoading = false;
            this._errorMessage = null;
        });
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
