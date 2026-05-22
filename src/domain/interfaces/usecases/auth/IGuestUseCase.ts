import { User } from '../../../entities/User';

export interface IGuestUseCase {
    continueAsGuest(): Promise<User>;
}
