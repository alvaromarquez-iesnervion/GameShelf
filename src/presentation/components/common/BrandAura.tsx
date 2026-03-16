import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';

interface BrandAuraProps {
    style?: StyleProp<ViewStyle>;
}

/**
 * Decorative accent used in top areas (headers/hero sections).
 * Keep it subtle: it's meant to add atmosphere and a recognizable "GameShelf" signature.
 */
export const BrandAura: React.FC<BrandAuraProps> = ({ style }) => {
    return (
        <>
            <LinearGradient
                colors={[...colors.brandAuraStops]}
                start={{ x: 0.0, y: 0.0 }}
                end={{ x: 1.0, y: 0.8 }}
                style={[styles.layer, style]}
                pointerEvents="none"
            />
            {/* Secondary diagonal wash for depth */}
            <LinearGradient
                colors={[colors.primarySubtle, 'transparent']}
                start={{ x: 0.9, y: 0.1 }}
                end={{ x: 0.1, y: 0.9 }}
                style={[styles.layer, style, styles.secondary]}
                pointerEvents="none"
            />
        </>
    );
};

const styles = StyleSheet.create({
    layer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    secondary: {
        opacity: 0.9,
    },
});

