import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadows, textShadows, springPresets } from '../../theme/spacing';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { PlatformIcon } from '../platforms/PlatformIcon';

interface GameCardProps {
    gameId: string;
    coverUrl: string;
    portraitCoverUrl?: string;
    title: string;
    platforms?: GamePlatform[];
    onPress: (id: string) => void;
}

const SPRING_CONFIG = springPresets.cardPress;

export const GameCard = React.memo(({ gameId, coverUrl, portraitCoverUrl, title, platforms, onPress }: GameCardProps) => {
    const imageSource = portraitCoverUrl || coverUrl;
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.94, SPRING_CONFIG);
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, SPRING_CONFIG);
    }, [scale]);

    const handlePress = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress(gameId);
    }, [onPress, gameId]);

    const visiblePlatforms = platforms?.filter(p => p !== GamePlatform.UNKNOWN) ?? [];

    return (
        <Animated.View style={[styles.card, animatedStyle]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                style={styles.touchArea}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageSource }}
                        style={styles.cover}
                        contentFit="cover"
                        transition={300}
                        recyclingKey={gameId}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.9)']}
                        locations={[0.5, 1]}
                        style={styles.gradient}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'transparent']}
                        style={styles.topVignette}
                    />
                    {visiblePlatforms.length > 0 && (
                        <View style={styles.badgeContainer}>
                            {visiblePlatforms.map(p => (
                                <View key={p} style={styles.platformPill}>
                                    <PlatformIcon platform={p} size={12} />
                                </View>
                            ))}
                        </View>
                    )}
                    <View style={styles.titleOverlay}>
                        <Text style={styles.title} numberOfLines={2}>{title}</Text>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
}, (prev, next) =>
    prev.gameId === next.gameId &&
    prev.coverUrl === next.coverUrl &&
    prev.portraitCoverUrl === next.portraitCoverUrl &&
    prev.title === next.title &&
    prev.onPress === next.onPress &&
    prev.platforms?.length === next.platforms?.length &&
    (prev.platforms?.every((p, i) => p === next.platforms?.[i]) ?? true),
);
GameCard.displayName = 'GameCard';

const styles = StyleSheet.create({
    card: {
        width: '31%',
        marginBottom: spacing.md,
        ...shadows.card,
    },
    touchArea: {
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    imageContainer: {
        aspectRatio: 2/3,
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
        height: '60%',
    },
    topVignette: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '25%',
    },
    badgeContainer: {
        position: 'absolute',
        top: spacing.xs + 2,
        right: spacing.xs + 2,
        flexDirection: 'row',
        gap: 3,
    },
    platformPill: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.overlayDark,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderWhiteThin,
    },
    titleOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.sm,
        paddingBottom: spacing.sm,
    },
    title: {
        ...typography.cardTitle,
        ...textShadows.onImage,
    },
});
