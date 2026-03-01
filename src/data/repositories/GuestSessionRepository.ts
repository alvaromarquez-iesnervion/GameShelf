import 'reflect-metadata';
import { injectable } from 'inversify';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IGuestSessionRepository } from '../../domain/interfaces/repositories/IGuestSessionRepository';
import {
    GUEST_KEY_ID,
    GUEST_KEY_PLATFORMS,
    GUEST_KEY_LIBRARY,
    generateGuestId,
} from '../../core/utils/guestUtils';

@injectable()
export class GuestSessionRepository implements IGuestSessionRepository {
    async getOrCreateGuestId(): Promise<string> {
        let id = await AsyncStorage.getItem(GUEST_KEY_ID);
        if (!id) {
            id = generateGuestId();
            await AsyncStorage.setItem(GUEST_KEY_ID, id);
        }
        return id;
    }

    async loadGuestId(): Promise<string | null> {
        return AsyncStorage.getItem(GUEST_KEY_ID);
    }

    async clearGuestSession(): Promise<void> {
        await AsyncStorage.multiRemove([GUEST_KEY_ID, GUEST_KEY_PLATFORMS, GUEST_KEY_LIBRARY]);
    }
}
