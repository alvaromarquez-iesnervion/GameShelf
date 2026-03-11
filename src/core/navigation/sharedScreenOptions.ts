import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

type ColorsSubset = {
    surface: string;
    textPrimary: string;
    background: string;
};

/**
 * Returns a shared screenOptions object for NativeStack navigators.
 * Intensity is unified at 60 across all stacks (portrait-only app).
 */
export function makeBlurHeader(colors: ColorsSubset) {
    return {
        headerTransparent: true,
        headerBackground: () =>
            Platform.OS === 'ios' ? (
                React.createElement(BlurView, {
                    intensity: 60,
                    tint: 'dark' as const,
                    style: StyleSheet.absoluteFill,
                })
            ) : null,
        headerStyle: {
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.surface,
        },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
    };
}
