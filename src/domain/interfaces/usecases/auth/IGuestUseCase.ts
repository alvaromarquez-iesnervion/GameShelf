import { User } from '../../../entities/User';

/** Sesión de invitado sin cuenta registrada. */
export interface IGuestUseCase {
    continueAsGuest(): Promise<User>;
    clearGuestSession(): Promise<void>;
}
