import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { SearchStackParamList } from './navigationTypes';
import { SearchScreen } from '../../presentation/screens/search/SearchScreen';
import { GameDetailScreen } from '../../presentation/screens/games/GameDetailScreen';
import { colors } from '../../presentation/theme/colors';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export const SearchStack: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTransparent: true,
                headerBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
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
                name="Search"
                component={SearchScreen}
                options={{ title: '' }}
            />
            <Stack.Screen
                name="GameDetail"
                component={GameDetailScreen}
                options={{
                    title: '',
                    headerTransparent: true,
                    headerBackground: undefined,
                }}
            />
        </Stack.Navigator>
    );
};
