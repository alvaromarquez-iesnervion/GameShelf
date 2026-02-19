import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    Auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    deleteUser,
} from 'firebase/auth';
import {
    Firestore,
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    collection,
    getDocs,
} from 'firebase/firestore';
import { IAuthRepository } from '../../domain/interfaces/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';
import { TYPES } from '../../di/types';

@injectable()
export class AuthRepositoryImpl implements IAuthRepository {

    constructor(
        @inject(TYPES.FirebaseAuth) private auth: Auth,
        @inject(TYPES.Firestore) private firestore: Firestore,
    ) {}

    async register(email: string, password: string): Promise<User> {
        const credential = await createUserWithEmailAndPassword(this.auth, email, password);
        const uid = credential.user.uid;
        const displayName = email.split('@')[0];
        const createdAt = new Date();

        await setDoc(doc(this.firestore, 'users', uid), {
            email,
            displayName,
            createdAt: createdAt.toISOString(),
            notificationsEnabled: false,
        });

        return new User(uid, email, displayName, createdAt);
    }

    async login(email: string, password: string): Promise<User> {
        const credential = await signInWithEmailAndPassword(this.auth, email, password);
        const uid = credential.user.uid;

        const snap = await getDoc(doc(this.firestore, 'users', uid));
        if (!snap.exists()) {
            throw new Error('Usuario no encontrado en Firestore');
        }

        const data = snap.data();
        return new User(
            uid,
            data.email ?? email,
            data.displayName ?? email.split('@')[0],
            data.createdAt ? new Date(data.createdAt) : new Date(),
        );
    }

    async logout(): Promise<void> {
        await signOut(this.auth);
    }

    async getCurrentUser(): Promise<User | null> {
        const firebaseUser = this.auth.currentUser;
        if (!firebaseUser) return null;

        const snap = await getDoc(doc(this.firestore, 'users', firebaseUser.uid));
        if (!snap.exists()) return null;

        const data = snap.data();
        return new User(
            firebaseUser.uid,
            data.email ?? firebaseUser.email ?? '',
            data.displayName ?? '',
            data.createdAt ? new Date(data.createdAt) : new Date(),
        );
    }

    async deleteAccount(): Promise<void> {
        const firebaseUser = this.auth.currentUser;
        if (!firebaseUser) throw new Error('No hay sesión activa');

        const uid = firebaseUser.uid;

        // 1. Borrar subcolecciones de Firestore
        const subCollections = ['library', 'wishlist', 'platforms'];
        for (const col of subCollections) {
            const snap = await getDocs(collection(this.firestore, 'users', uid, col));
            for (const docSnap of snap.docs) {
                await deleteDoc(docSnap.ref);
            }
        }

        // 2. Borrar settings/notifications
        await deleteDoc(doc(this.firestore, 'users', uid, 'settings', 'notifications'))
            .catch(() => { /* puede no existir */ });

        // 3. Borrar documento raíz del usuario
        await deleteDoc(doc(this.firestore, 'users', uid));

        // 4. Borrar cuenta de Firebase Auth
        await deleteUser(firebaseUser);
    }
}
