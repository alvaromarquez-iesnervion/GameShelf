import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { makeAutoObservable, runInAction } from 'mobx';
import { IWishlistUseCase } from '../../domain/interfaces/usecases/wishlist/IWishlistUseCase';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { TYPES } from '../../di/types';

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

    constructor(
        @inject(TYPES.IWishlistUseCase)
        private readonly wishlistUseCase: IWishlistUseCase,
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
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            const items = await this.wishlistUseCase.getWishlist(userId);
            runInAction(() => {
                this._items = items;
            });
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    async addToWishlist(userId: string, item: WishlistItem): Promise<boolean> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            await this.wishlistUseCase.addToWishlist(userId, item);
            // Recargar la lista para obtener datos actualizados
            await this.loadWishlist(userId);
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    async removeFromWishlist(userId: string, itemId: string): Promise<boolean> {
        runInAction(() => {
            this._isLoading = true;
            this._errorMessage = null;
        });

        try {
            await this.wishlistUseCase.removeFromWishlist(userId, itemId);
            // Actualizar la lista local sin recargar
            runInAction(() => {
                this._items = this._items.filter(item => item.getId() !== itemId);
            });
            return true;
        } catch (error) {
            runInAction(() => {
                this._errorMessage = (error as Error).message;
            });
            return false;
        } finally {
            runInAction(() => {
                this._isLoading = false;
            });
        }
    }

    isGameInWishlist(gameId: string): boolean {
        return this._items.some(item => item.getGameId() === gameId);
    }

    clearError(): void {
        this._errorMessage = null;
    }
}
