import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Usa Firebase JS SDK (no @react-native-firebase) para compatibilidad con Expo Go.
 * Las variables de entorno usan el prefijo EXPO_PUBLIC_ para ser accesibles en cliente.
 *
 * Llamar a initializeFirebase() desde App.tsx ANTES de montar el árbol de React.
 * getFirebaseAuth() y getFirebaseFirestore() devuelven las instancias singleton.
 */

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let authInstance: Auth;
let firestoreInstance: Firestore;

export function initializeFirebase(): FirebaseApp {
    // Evita reinicializar si ya se llamó (útil en hot reload de desarrollo)
    if (getApps().length > 0) {
        app = getApps()[0];
    } else {
        app = initializeApp(firebaseConfig);
    }
    authInstance = getAuth(app);
    firestoreInstance = getFirestore(app);
    return app;
}

export function getFirebaseAuth(): Auth {
    return authInstance;
}

export function getFirebaseFirestore(): Firestore {
    return firestoreInstance;
}
