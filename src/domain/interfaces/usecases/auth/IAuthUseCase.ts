import { IAuthSessionUseCase } from './IAuthSessionUseCase';
import { IGuestUseCase } from './IGuestUseCase';
import { IAccountManagementUseCase } from './IAccountManagementUseCase';

/**
 * Interfaz compuesta para funcionalidad de auth completa.
 *
 * Los consumidores que solo necesitan un subconjunto pueden depender
 * de las interfaces más pequeñas directamente (ISP):
 *   - IAuthSessionUseCase      — login, register, logout, getCurrentUser, checkAuthState
 *   - IGuestUseCase            — continueAsGuest, clearGuestSession
 *   - IAccountManagementUseCase — deleteAccount, resetPassword
 */
export interface IAuthUseCase
    extends IAuthSessionUseCase,
        IGuestUseCase,
        IAccountManagementUseCase {}
