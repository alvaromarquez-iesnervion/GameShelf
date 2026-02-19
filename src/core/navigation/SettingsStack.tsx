import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { SettingsStackParamList } from './navigationTypes';
import { SettingsScreen } from '../../presentation/screens/settings/SettingsScreen';
import { PlatformLinkScreen } from '../../presentation/screens/settings/PlatformLinkScreen';
import { NotificationSettingsScreen } from '../../presentation/screens/settings/NotificationSettingsScreen';
import { ProfileScreen } from '../../presentation/screens/profile/ProfileScreen';
import { colors } from '../../presentation/theme/colors';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

const blurHeader = () =>
    Platform.OS === 'ios' ? (
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
    ) : null;

export const SettingsStack: React.FC = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTransparent: true,
                headerBackground: blurHeader,
                headerStyle: {
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
                },
                headerTintColor: colors.textPrimary,
                contentStyle: { backgroundColor: colors.background },
            }}
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
