import { User } from '../../../entities/User';

export interface IAuthUseCase {
    login(email: string, password: string): Promise<User>;
    register(email: string, password: string): Promise<User>;
    logout(isGuest: boolean): Promise<void>;
    getCurrentUser(): Promise<User | null>;
    /** Firebase auth check + guest session fallback. */
    checkAuthState(): Promise<User | null>;
    continueAsGuest(): Promise<User>;
    deleteAccount(): Promise<void>;
    resetPassword(email: string): Promise<void>;
    clearGuestSession(): Promise<void>;
}
