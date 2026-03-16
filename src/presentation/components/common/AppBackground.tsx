import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface AppBackgroundProps {
    children: React.ReactNode;
}

/**
 * Global app background.
 * Renders a very subtle gradient behind all navigators/screens to avoid "flat black".
 *
 * Note: screens should prefer `backgroundColor: 'transparent'` so this can show through.
 */
export const AppBackground: React.FC<AppBackgroundProps> = ({ children }) => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[...colors.backgroundGradientStops]}
                start={{ x: 0.15, y: 0.0 }}
                end={{ x: 0.85, y: 1.0 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />
            {/* Brand aura overlay (signature) */}
            <LinearGradient
                colors={[...colors.brandAuraStops]}
                start={{ x: 0.0, y: 0.1 }}
                end={{ x: 1.0, y: 0.6 }}
                style={[StyleSheet.absoluteFill, styles.aura]}
                pointerEvents="none"
            />
            <View style={styles.content}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundBase,
    },
    aura: {
        opacity: 0.25,
    },
    content: {
        flex: 1,
    },
});
