import { IAuthSessionUseCase } from './IAuthSessionUseCase';
import { IGuestUseCase } from './IGuestUseCase';
import { IAccountManagementUseCase } from './IAccountManagementUseCase';

/**
 * Composite interface covering the full auth surface.
 *
 * Consumers that only need a subset can depend on the smaller interfaces
 * directly (ISP):
 *   - IAuthSessionUseCase       — login, register, logout, getCurrentUser, checkAuthState
 *   - IGuestUseCase             — continueAsGuest
 *   - IAccountManagementUseCase — deleteAccount, resetPassword
 */
export interface IAuthUseCase
    extends IAuthSessionUseCase,
        IGuestUseCase,
        IAccountManagementUseCase {}
