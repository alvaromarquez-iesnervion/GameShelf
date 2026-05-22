import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import {
    Auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    deleteUser,
    sendPasswordResetEmail,
    signInAnonymously as firebaseSignInAnonymously,
} from 'firebase/auth';
import {
    Firestore,
    doc,
    setDoc,
    getDoc,
} from 'firebase/firestore';
import { IAuthRepository } from '../../domain/interfaces/repositories/IAuthRepository';
import { User } from '../../domain/entities/User';
import { TYPES } from '../../di/types';

/**
 * IAuthRepository implementation backed by Firebase Auth + Firestore.
 *
 * Auth state (session persistence) is managed by the Firebase SDK; the app
 * does not store tokens manually. getCurrentUser() always waits for
 * authStateReady() so it is safe to call immediately on startup.
 */
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

        try {
            await setDoc(doc(this.firestore, 'users', uid), {
                email,
                displayName,
                createdAt: createdAt.toISOString(),
                notificationsEnabled: false,
            });
        } catch (firestoreError) {
            // If Firestore document creation fails, delete the Auth account to
            // avoid leaving it orphaned (email blocked, no Firestore document).
            await deleteUser(credential.user).catch(() => {});
            throw firestoreError;
        }

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

    async signInAnonymously(): Promise<User> {
        const credential = await firebaseSignInAnonymously(this.auth);
        return new User(credential.user.uid, '', 'Invitado', new Date(), true);
    }

    async getCurrentUser(): Promise<User | null> {
        // Wait for Firebase to restore the persisted session before reading auth.currentUser.
        // authStateReady() resolves once at startup; subsequent calls are immediate.
        await this.auth.authStateReady();

        const firebaseUser = this.auth.currentUser;
        if (!firebaseUser) return null;

        // Anonymous users: no Firestore document exists, return directly.
        if (firebaseUser.isAnonymous) {
            return new User(firebaseUser.uid, '', 'Invitado', new Date(), true);
        }

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

    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(this.auth, email);
    }
}
