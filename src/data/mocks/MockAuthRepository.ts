import 'reflect-metadata';
import { injectable } from 'inversify';
import { IAuthRepository } from '../../domain/interfaces/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';
import { MOCK_USER, simulateDelay } from './MockDataProvider';

/**
 * Mock de IAuthRepository.
 *
 * Para testing: sesión ya iniciada con MOCK_USER y Steam vinculado.
 *
 * Credenciales de prueba:
 *   Email:    dev@gameshelf.app  (o cualquier email con formato válido)
 *   Password: cualquiera de 6+ caracteres
 */
@injectable()
export class MockAuthRepository implements IAuthRepository {

    private currentUser: User = MOCK_USER; // sesión ya iniciada para testing

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
        this.currentUser = MOCK_USER; // mantiene sesión para testing
    }

    async getCurrentUser(): Promise<User | null> {
        await simulateDelay(200);
        return this.currentUser;
    }

    async deleteAccount(): Promise<void> {
        await simulateDelay(600);
        this.currentUser = MOCK_USER; // mantiene sesión para testing
    }
}
