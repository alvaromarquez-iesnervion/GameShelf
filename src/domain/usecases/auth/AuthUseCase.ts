import { IAuthUseCase } from '../../interfaces/usecases/auth/IAuthUseCase';
import { IAuthRepository } from '../../interfaces/repositories/IAuthRepository';
import { IGuestSessionRepository } from '../../interfaces/repositories/IGuestSessionRepository';
import { User } from '../../entities/User';

export class AuthUseCase implements IAuthUseCase {
    constructor(
        private readonly authRepository: IAuthRepository,
        private readonly guestSessionRepository: IGuestSessionRepository,
    ) {}

    async login(email: string, password: string): Promise<User> {
        const user = await this.authRepository.login(email, password);
        await this.guestSessionRepository.clearGuestSession();
        return user;
    }

    async register(email: string, password: string): Promise<User> {
        const user = await this.authRepository.register(email, password);
        await this.guestSessionRepository.clearGuestSession();
        return user;
    }

    async logout(isGuest: boolean): Promise<void> {
        if (isGuest) {
            await this.guestSessionRepository.clearGuestSession();
        } else {
            await this.authRepository.logout();
        }
    }

    async getCurrentUser(): Promise<User | null> {
        return this.authRepository.getCurrentUser();
    }

    async checkAuthState(): Promise<User | null> {
        const user = await this.authRepository.getCurrentUser();
        if (user) return user;

        const guestId = await this.guestSessionRepository.loadGuestId();
        if (guestId) {
            return new User(guestId, '', 'Invitado', new Date());
        }
        return null;
    }

    async continueAsGuest(): Promise<User> {
        const guestId = await this.guestSessionRepository.getOrCreateGuestId();
        return new User(guestId, '', 'Invitado', new Date());
    }

    async deleteAccount(): Promise<void> {
        await this.authRepository.deleteAccount();
    }

    async resetPassword(email: string): Promise<void> {
        await this.authRepository.resetPassword(email);
    }

    async clearGuestSession(): Promise<void> {
        await this.guestSessionRepository.clearGuestSession();
    }
}
