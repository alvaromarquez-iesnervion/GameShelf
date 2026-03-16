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
 *
 * Uses the platform-native push animation (slide_from_right on iOS)
 * so swipe-back gestures work correctly. Individual screens or stacks
 * can override `animation` when a different transition is needed.
 */
export function makeBlurHeader(colors: ColorsSubset) {
    return {
        animation: 'default' as const,
        animationDuration: 350,
        gestureEnabled: true,
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
        // Transparent so the global AppBackground gradient can show through.
        contentStyle: { backgroundColor: 'transparent' },
    };
}
