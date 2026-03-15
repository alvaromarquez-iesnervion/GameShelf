import { User } from '../../../entities/User';

/** Autenticación básica de usuario registrado. */
export interface IAuthSessionUseCase {
    login(email: string, password: string): Promise<User>;
    register(email: string, password: string): Promise<User>;
    logout(isGuest: boolean): Promise<void>;
    getCurrentUser(): Promise<User | null>;
    /** Firebase auth check + guest session fallback. */
    checkAuthState(): Promise<User | null>;
}
