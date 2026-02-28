import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface ShimmerProps {
    width: DimensionValue;
    height: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Shimmer: React.FC<ShimmerProps> = ({ width, height, borderRadius = 4, style }) => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.25,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <Animated.View
            style={[
                styles.base,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
};

const styles = StyleSheet.create({
    base: {
        backgroundColor: colors.surfaceElevated,
    },
});
