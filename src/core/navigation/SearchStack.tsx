import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchStackParamList } from './navigationTypes';
import { SearchScreen } from '../../presentation/screens/search/SearchScreen';
import { GameDetailScreen } from '../../presentation/screens/games/GameDetailScreen';
import { colors } from '../../presentation/theme/colors';
import { makeBlurHeader } from './sharedScreenOptions';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export const SearchStack: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={makeBlurHeader(colors)}
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
