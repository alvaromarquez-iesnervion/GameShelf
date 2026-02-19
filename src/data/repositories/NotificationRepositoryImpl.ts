import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    Firestore,
    doc,
    getDoc,
    setDoc,
} from 'firebase/firestore';
import { INotificationRepository } from '../../domain/interfaces/repositories/INotificationRepository';
import { NotificationPreferences } from '../../domain/entities/NotificationPreferences';
import { TYPES } from '../../di/types';

@injectable()
export class NotificationRepositoryImpl implements INotificationRepository {

    constructor(
        @inject(TYPES.Firestore) private firestore: Firestore,
    ) {}

    async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
        const snap = await getDoc(
            doc(this.firestore, 'users', userId, 'settings', 'notifications'),
        );

        if (!snap.exists()) {
            // Primer acceso: devuelve preferencias por defecto (sin guardar aún)
            return new NotificationPreferences(false);
        }

        const data = snap.data();
        return new NotificationPreferences(data.dealsEnabled ?? false);
    }

    async updateNotificationPreferences(
        userId: string,
        preferences: NotificationPreferences,
    ): Promise<void> {
        await setDoc(
            doc(this.firestore, 'users', userId, 'settings', 'notifications'),
            { dealsEnabled: preferences.getDealsEnabled() },
            { merge: true },
        );
    }
}
