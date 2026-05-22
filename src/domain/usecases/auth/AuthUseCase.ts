import { IAuthUseCase } from '../../interfaces/usecases/auth/IAuthUseCase';
import { IAuthRepository } from '../../interfaces/repositories/IAuthRepository';
import { IGameShelfApiClient } from '../../interfaces/services/IGameShelfApiClient';
import { User } from '../../entities/User';

/**
 * Handles all authentication flows: email/password, anonymous guest, and account deletion.
 *
 * After every successful login or registration, syncUser() is fired in the background
 * to ensure the backend has an up-to-date record of the user.
 *
 * Guest logout deletes the anonymous account from the backend before signing out locally,
 * so orphaned guest data is cleaned up even when the device goes offline mid-flow.
 */
export class AuthUseCase implements IAuthUseCase {
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly api: IGameShelfApiClient,
    ) {}

    async login(email: string, password: string): Promise<User> {
        const user = await this.authRepository.login(email, password);
        this.api.syncUser().catch(() => {});
        return user;
    }

    async register(email: string, password: string): Promise<User> {
        const user = await this.authRepository.register(email, password);
        this.api.syncUser().catch(() => {});
        return user;
    }

    async logout(isGuest: boolean): Promise<void> {
        if (isGuest) {
            try {
                await this.api.deleteAccount();
            } catch {
                // No connection or other error — continue with local signOut anyway.
            }
        }
        await this.authRepository.logout();
    }

    async getCurrentUser(): Promise<User | null> {
        return this.authRepository.getCurrentUser();
    }

    async checkAuthState(): Promise<User | null> {
        // Firebase persists anonymous sessions automatically; no custom AsyncStorage needed.
        return this.authRepository.getCurrentUser();
    }

    async continueAsGuest(): Promise<User> {
        const user = await this.authRepository.signInAnonymously();
        this.api.syncUser().catch(() => {});
        return user;
    }

    async deleteAccount(): Promise<void> {
        await this.api.deleteAccount();
    }

    async resetPassword(email: string): Promise<void> {
        await this.authRepository.resetPassword(email);
    }
}
