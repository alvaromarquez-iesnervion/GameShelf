import { IAuthUseCase } from '../../interfaces/usecases/auth/IAuthUseCase';
import { IAuthRepository } from '../../interfaces/repositories/IAuthRepository';
import { IGameShelfApiClient } from '../../interfaces/services/IGameShelfApiClient';
import { User } from '../../entities/User';

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
                // Sin conexión u otro error — continuar con el signOut local igualmente.
            }
        }
        await this.authRepository.logout();
    }

    async getCurrentUser(): Promise<User | null> {
        return this.authRepository.getCurrentUser();
    }

    async checkAuthState(): Promise<User | null> {
        // Firebase persiste sesiones anónimas automáticamente; no hay AsyncStorage propio.
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
