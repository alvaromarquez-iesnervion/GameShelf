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
            screenOptions={makeBlurHeader(colors)}
        >
            <Stack.Screen
                name="Wishlist"
                component={WishlistScreen}
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
