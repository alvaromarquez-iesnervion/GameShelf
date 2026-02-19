import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    Firestore,
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    where,
} from 'firebase/firestore';
import { IWishlistRepository } from '../../domain/interfaces/repositories/IWishlistRepository';
import { WishlistItem } from '../../domain/entities/WishlistItem';
import { FirestoreWishlistMapper } from '../mappers/FirestoreWishlistMapper';
import { TYPES } from '../../di/types';

@injectable()
export class WishlistRepositoryImpl implements IWishlistRepository {

    constructor(
        @inject(TYPES.Firestore) private firestore: Firestore,
    ) {}

    async getWishlist(userId: string): Promise<WishlistItem[]> {
        const snap = await getDocs(
            collection(this.firestore, 'users', userId, 'wishlist'),
        );
        return snap.docs.map(d => FirestoreWishlistMapper.toDomain(d.id, d.data()));
    }

    async addToWishlist(userId: string, item: WishlistItem): Promise<void> {
        const ref = doc(this.firestore, 'users', userId, 'wishlist', item.getId());
        await setDoc(ref, FirestoreWishlistMapper.toFirestore(item));
    }

    async removeFromWishlist(userId: string, itemId: string): Promise<void> {
        await deleteDoc(doc(this.firestore, 'users', userId, 'wishlist', itemId));
    }

    async isInWishlist(userId: string, gameId: string): Promise<boolean> {
        const q = query(
            collection(this.firestore, 'users', userId, 'wishlist'),
            where('gameId', '==', gameId),
        );
        const snap = await getDocs(q);
        return !snap.empty;
    }
}
