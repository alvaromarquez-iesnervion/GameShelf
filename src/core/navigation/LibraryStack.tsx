import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LibraryStackParamList } from './navigationTypes';
import { LibraryScreen } from '../../presentation/screens/library/LibraryScreen';
import { GameDetailScreen } from '../../presentation/screens/games/GameDetailScreen';
import { colors } from '../../presentation/theme/colors';
import { makeBlurHeader } from './sharedScreenOptions';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export const LibraryStack: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={makeBlurHeader(colors)}
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
