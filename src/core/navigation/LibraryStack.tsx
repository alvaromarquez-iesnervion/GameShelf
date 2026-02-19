import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { LibraryStackParamList } from './navigationTypes';
import { LibraryScreen } from '../../presentation/screens/library/LibraryScreen';
import { GameDetailScreen } from '../../presentation/screens/games/GameDetailScreen';
import { colors } from '../../presentation/theme/colors';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export const LibraryStack: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTransparent: true,
                headerBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                    ) : null
                ),
                headerStyle: {
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
                },
                headerTintColor: colors.textPrimary,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen 
                name="Library" 
                component={LibraryScreen} 
                options={{ 
                    title: '',
                    headerShown: true,
                }} 
            />
            <Stack.Screen 
                name="GameDetail" 
                component={GameDetailScreen} 
                options={{ 
                    title: '',
                    headerTransparent: true,
                    headerBackground: undefined, // Inmersivo
                }} 
            />
        </Stack.Navigator>
    );
};
