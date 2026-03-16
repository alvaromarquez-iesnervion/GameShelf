import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WishlistStackParamList } from './navigationTypes';
import { WishlistScreen } from '../../presentation/screens/wishlist/WishlistScreen';
import { GameDetailScreen } from '../../presentation/screens/games/GameDetailScreen';
import { colors } from '../../presentation/theme/colors';
import { makeBlurHeader } from './sharedScreenOptions';

const Stack = createNativeStackNavigator<WishlistStackParamList>();

export const WishlistStack: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                ...makeBlurHeader(colors),
                // Inside a formSheet modal — keep default animation for inner push
                gestureEnabled: true,
            }}
        >
            <Stack.Screen
                name="Wishlist"
                component={WishlistScreen}
                options={{
                    title: '',
                    headerShown: false,
                    // Root screen inherits formSheet gesture — no custom animation
                    animation: 'none',
                }}
            />
            <Stack.Screen
                name="GameDetail"
                component={GameDetailScreen}
                options={{
                    title: '',
                    headerTransparent: true,
                    headerBackground: undefined,
                    animation: 'slide_from_right',
                }}
            />
        </Stack.Navigator>
    );
};
