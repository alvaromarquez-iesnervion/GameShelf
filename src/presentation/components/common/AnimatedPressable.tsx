import React, { useCallback } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

interface AnimatedPressableProps {
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    scaleDown?: number;
    children: React.ReactNode;
    disabled?: boolean;
}

const SPRING_CONFIG = {
    damping: 15,
    stiffness: 400,
    mass: 0.4,
};

/**
 * Pressable wrapper with native-thread spring scale animation.
 * Uses Pressable (not raw touch events) so it cooperates with ScrollView gestures.
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
    onPress,
    style,
    scaleDown = 0.96,
    children,
    disabled,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(scaleDown, SPRING_CONFIG);
    }, [scale, scaleDown]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, SPRING_CONFIG);
    }, [scale]);

    return (
        <Animated.View style={[style, animatedStyle]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={disabled ? undefined : onPress}
                disabled={disabled}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};
