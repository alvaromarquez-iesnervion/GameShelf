import 'reflect-metadata';
import { injectable } from 'inversify';
import { IAuthRepository } from '../../domain/interfaces/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';
import { MOCK_USER, simulateDelay } from './MockDataProvider';

/**
 * Mock implementation of IAuthRepository.
 *
 * For testing: session is pre-started with MOCK_USER and Steam linked.
 *
 * Test credentials:
 *   Email:    dev@gameshelf.app  (or any valid email format)
 *   Password: any string of 6+ characters
 */
@injectable()
export class MockAuthRepository implements IAuthRepository {

    private currentUser: User | null = MOCK_USER; // pre-started session for testing

    async register(email: string, password: string): Promise<User> {
        await simulateDelay(800);
        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        const user = new User(
            `mock-uid-${Date.now()}`,
            email,
            email.split('@')[0],
            new Date(),
        );
        this.currentUser = user;
        return user;
    }

    async login(email: string, password: string): Promise<User> {
        await simulateDelay(700);
        if (!email.includes('@')) {
            throw new Error('El formato del email no es válido');
        }
        if (password.length < 6) {
            throw new Error('Credenciales incorrectas');
        }
        const user = new User(
            MOCK_USER.getId(),
            email,
            email.split('@')[0],
            MOCK_USER.getCreatedAt(),
        );
        this.currentUser = user;
        return user;
    }

    async logout(): Promise<void> {
        await simulateDelay(300);
        this.currentUser = null;
    }

    async signInAnonymously(): Promise<User> {
        await simulateDelay(300);
        const user = new User('mock-guest-uid', '', 'Invitado', new Date(), true);
        this.currentUser = user;
        return user;
    }

    async getCurrentUser(): Promise<User | null> {
        await simulateDelay(200);
        return this.currentUser;
    }

    async resetPassword(email: string): Promise<void> {
        await simulateDelay(600);
        if (!email.includes('@')) {
            throw new Error('El formato del email no es válido');
        }
        // In mock mode: silently simulate success
    }
}
