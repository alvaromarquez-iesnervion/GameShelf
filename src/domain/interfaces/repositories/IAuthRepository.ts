import { User } from '../../entities/User';

export interface IAuthRepository {
    register(email: string, password: string): Promise<User>;
    login(email: string, password: string): Promise<User>;
    logout(): Promise<void>;
    signInAnonymously(): Promise<User>;
    /** Restores the session on app startup. Returns null if no active session exists. */
    getCurrentUser(): Promise<User | null>;
    /** Sends a password recovery email to the given address. */
    resetPassword(email: string): Promise<void>;
}
