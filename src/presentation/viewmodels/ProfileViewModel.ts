import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../di/types';
import { AuthViewModel } from './AuthViewModel';
import { LibraryViewModel } from './LibraryViewModel';
import { WishlistViewModel } from './WishlistViewModel';
import { User } from '../../domain/entities/User';

/**
 * ViewModel para la pantalla de perfil.
 *
 * Agrega datos de AuthViewModel, LibraryViewModel y WishlistViewModel
 * para que ProfileScreen no dependa directamente de 3 ViewModels distintos.
 */
@injectable()
export class ProfileViewModel {
    constructor(
        @inject(TYPES.AuthViewModel)
        private readonly authVm: AuthViewModel,
        @inject(TYPES.LibraryViewModel)
        private readonly libraryVm: LibraryViewModel,
        @inject(TYPES.WishlistViewModel)
        private readonly wishlistVm: WishlistViewModel,
    ) {}

    get user(): User | null {
        return this.authVm.currentUser;
    }

    get libraryCount(): number {
        return this.libraryVm.games.length;
    }

    get platformCount(): number {
        return this.libraryVm.linkedPlatforms.length;
    }

    get wishlistCount(): number {
        return this.wishlistVm.items.length;
    }

    get isLoading(): boolean {
        return this.authVm.isLoading || this.libraryVm.isLoading;
    }
}
