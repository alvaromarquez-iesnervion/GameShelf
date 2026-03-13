import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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
    // Validate required configuration keys before attempting initialization
    const requiredKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'projectId', 'appId'];
    for (const key of requiredKeys) {
        if (!firebaseConfig[key]) {
            throw new Error(
                `Firebase: la variable de entorno EXPO_PUBLIC_FIREBASE_${key.toUpperCase()} es obligatoria pero no está definida. ` +
                'Copia .env.example → .env y rellena los valores.',
            );
        }
    }

    const alreadyInitialized = getApps().length > 0;

    // Evita reinicializar si ya se llamó (útil en hot reload de desarrollo)
    app = alreadyInitialized ? getApps()[0] : initializeApp(firebaseConfig);

    // initializeAuth con getReactNativePersistence persiste la sesión entre reinicios via AsyncStorage.
    // En hot reload la instancia ya existe,
    // por lo que usamos getAuth() para recuperarla sin lanzar "already initialized".
    authInstance = alreadyInitialized
        ? getAuth(app)
        : initializeAuth(app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) });

    firestoreInstance = getFirestore(app);
    return app;
}

export function getFirebaseAuth(): Auth {
    return authInstance;
}

export function getFirebaseFirestore(): Firestore {
    return firestoreInstance;
}
