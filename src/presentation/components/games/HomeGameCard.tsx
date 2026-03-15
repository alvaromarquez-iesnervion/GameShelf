import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadows, textShadows, springPresets } from '../../theme/spacing';

interface HomeGameCardProps {
    coverUrl: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    size?: 'small' | 'medium' | 'featured';
    rank?: number;
}

const SPRING_CONFIG = springPresets.cardPress;

export const HomeGameCard = React.memo(({ coverUrl, title, subtitle, onPress, size = 'medium', rank }: HomeGameCardProps) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.95, SPRING_CONFIG);
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, SPRING_CONFIG);
    }, [scale]);

    const handlePress = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
    }, [onPress]);

    const dimensions = size === 'small'
        ? { coverWidth: 110, coverHeight: 148 }
        : size === 'featured'
        ? { coverWidth: 160, coverHeight: 214 }
        : { coverWidth: 130, coverHeight: 174 };

    return (
        <Animated.View style={[styles.card, { width: dimensions.coverWidth }, animatedStyle]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
            >
                <View style={[styles.coverWrap, { width: dimensions.coverWidth, height: dimensions.coverHeight }]}>
                    <Image
                        source={{ uri: coverUrl }}
                        style={styles.cover}
                        contentFit="cover"
                        transition={300}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.85)']}
                        locations={[0.55, 1]}
                        style={styles.gradient}
                    />
                    {rank !== undefined && (
                        <View style={styles.rankBadge}>
                            <Text style={styles.rankText}>{rank}</Text>
                        </View>
                    )}
                    {subtitle && (
                        <View style={styles.subtitleOverlay}>
                            <Text style={styles.subtitleText} numberOfLines={1}>{subtitle}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
});
HomeGameCard.displayName = 'HomeGameCard';

const styles = StyleSheet.create({
    card: {
        ...shadows.card,
    },
    coverWrap: {
        borderRadius: radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        position: 'relative',
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    rankBadge: {
        position: 'absolute',
        top: spacing.xs,
        left: spacing.xs,
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.overlayWhiteThin,
    },
    rankText: {
        ...typography.rankBadge,
    },
    subtitleOverlay: {
        position: 'absolute',
        bottom: spacing.sm,
        left: spacing.sm,
        right: spacing.sm,
    },
    subtitleText: {
        ...typography.cardSubtitle,
        ...textShadows.onImageLight,
    },
    info: {
        marginTop: spacing.sm,
        paddingHorizontal: 2,
    },
    title: {
        ...typography.caption,
        fontWeight: '700',
        color: colors.textPrimary,
        lineHeight: 16,
    },
});
