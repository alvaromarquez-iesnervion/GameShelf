import React from 'react';
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { MainTabParamList } from './navigationTypes';
import { SearchStack } from './SearchStack';
import { LibraryStack } from './LibraryStack';
import { SettingsStack } from './SettingsStack';
import { WishlistStack } from './WishlistStack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../../presentation/theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator();

const TabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
                },
                tabBarBackground: () => (
                    <BlurView 
                        intensity={80} 
                        tint="dark" 
                        style={StyleSheet.absoluteFill} 
                    />
                ),
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textTertiary,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="SearchTab"
                component={SearchStack}
                options={{
                    title: 'Buscar',
                    tabBarIcon: ({ color }) => (
                        <Feather name="search" size={22} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="LibraryTab"
                component={LibraryStack}
                options={{
                    title: 'Biblioteca',
                    tabBarIcon: ({ color }) => (
                        <Feather name="grid" size={22} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="SettingsTab"
                component={SettingsStack}
                options={{
                    title: 'Ajustes',
                    tabBarIcon: ({ color }) => (
                        <Feather name="settings" size={22} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export const MainTabNavigator: React.FC = () => {
    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
            <RootStack.Screen name="Tabs" component={TabNavigator} />
            <RootStack.Screen
                name="WishlistStack"
                component={WishlistStack}
                options={{ 
                    presentation: 'modal',
                    headerShown: false
                }}
            />
        </RootStack.Navigator>
    );
};
