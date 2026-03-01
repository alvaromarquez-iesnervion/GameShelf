import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './navigation/RootNavigator';
import { colors } from '../presentation/theme/colors';
// Importar container para que se ejecuten todos los bindings
import '../di/container';
import { initializeFirebase } from '../data/config/FirebaseConfig';

// Inicializar Firebase antes del contenedor DI (solo si las variables están configuradas)
if (process.env['EXPO_PUBLIC_FIREBASE_API_KEY']) {
    initializeFirebase();
}

const darkTheme = {
    ...DefaultTheme,
    dark: true,
    colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.textPrimary,
        border: colors.border,
        notification: colors.primary,
    },
};

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer theme={darkTheme}>
                <StatusBar style="light" />
                <RootNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    );
}
