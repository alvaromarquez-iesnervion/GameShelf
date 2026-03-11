import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from './navigationTypes';
import { SettingsScreen } from '../../presentation/screens/settings/SettingsScreen';
import { PlatformLinkScreen } from '../../presentation/screens/settings/PlatformLinkScreen';
import { NotificationSettingsScreen } from '../../presentation/screens/settings/NotificationSettingsScreen';
import { ProfileScreen } from '../../presentation/screens/profile/ProfileScreen';
import { colors } from '../../presentation/theme/colors';
import { makeBlurHeader } from './sharedScreenOptions';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export const SettingsStack: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={makeBlurHeader(colors)}
        >
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: '' }}
            />
            <Stack.Screen
                name="PlatformLink"
                component={PlatformLinkScreen}
                options={{ title: 'Plataformas' }}
            />
            <Stack.Screen
                name="NotificationSettings"
                component={NotificationSettingsScreen}
                options={{ title: 'Notificaciones' }}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Perfil' }}
            />
        </Stack.Navigator>
    );
};
