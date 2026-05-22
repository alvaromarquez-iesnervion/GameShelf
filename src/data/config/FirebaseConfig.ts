import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, Auth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Uses the Firebase JS SDK (not @react-native-firebase) for Expo Go compatibility.
 * Environment variables use the EXPO_PUBLIC_ prefix to be accessible on the client.
 *
 * Call initializeFirebase() from App.tsx BEFORE mounting the React tree.
 * getFirebaseAuth() and getFirebaseFirestore() return singleton instances.
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

    // Avoid re-initialising if already called (useful during hot reload in development)
    app = alreadyInitialized ? getApps()[0] : initializeApp(firebaseConfig);

    // initializeAuth with getReactNativePersistence persists the session across restarts via AsyncStorage.
    // On hot reload the instance already exists,
    // so we use getAuth() to retrieve it without throwing "already initialized".
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
