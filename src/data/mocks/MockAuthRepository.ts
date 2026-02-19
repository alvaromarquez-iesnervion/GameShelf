import 'reflect-metadata';
import { injectable } from 'inversify';
import { IAuthRepository } from '../../domain/interfaces/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';
import { MOCK_USER, simulateDelay } from './MockDataProvider';

/**
 * Mock de IAuthRepository.
 *
 * Credenciales de prueba:
 *   Email:    dev@gameshelf.app  (o cualquier email con formato válido)
 *   Password: cualquiera de 6+ caracteres
 *
 * - login: acepta cualquier email/contraseña (simula auth satisfactoria)
 * - register: crea un User en memoria con los datos aportados
 * - getCurrentUser: devuelve el usuario logueado o null
 * - logout/deleteAccount: limpian el estado en memoria
 */
@injectable()
export class MockAuthRepository implements IAuthRepository {

    private currentUser: User | null = null; // sin sesión activa al arrancar

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
        // Devuelve el usuario mock predefinido
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

    async getCurrentUser(): Promise<User | null> {
        await simulateDelay(200);
        return this.currentUser;
    }

    async deleteAccount(): Promise<void> {
        await simulateDelay(600);
        this.currentUser = null;
    }
}
