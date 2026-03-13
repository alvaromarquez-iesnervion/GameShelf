/**
 * Module augmentation to expose getReactNativePersistence from firebase/auth.
 *
 * Firebase's umbrella package types for firebase/auth point to the browser bundle
 * (dist/auth-public.d.ts), which does not include getReactNativePersistence.
 * At runtime Metro correctly resolves firebase/auth to the react-native bundle,
 * so this declaration simply restores the missing type information.
 */

import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module 'firebase/auth' {
    export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
