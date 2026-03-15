import React, { useCallback } from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, springPresets } from '../../theme/spacing';
import { PlatformBadge } from '../platforms/PlatformBadge';
import { Platform as GPlatform } from '../../../domain/enums/Platform';

interface SearchResultCardProps {
    coverUrl: string;
    title: string;
    isInWishlist: boolean;
    isOwned?: boolean;
    ownedPlatforms?: GPlatform[];
    onPress: () => void;
    onToggleWishlist: () => void;
}

const SPRING = springPresets.cardPress;

export const SearchResultCard = React.memo(({ coverUrl, title, isInWishlist, isOwned, ownedPlatforms, onPress, onToggleWishlist }: SearchResultCardProps) => {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.97, SPRING);
    }, [scale]);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, SPRING);
    }, [scale]);

    const handlePress = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
    }, [onPress]);

    const handleWishlist = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggleWishlist();
    };

    return (
        <Animated.View style={[styles.cardOuter, animStyle]}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handlePress}
                style={styles.card}
            >
                <View style={styles.coverWrap}>
                    <Image source={{ uri: coverUrl }} style={styles.cover} contentFit="cover" transition={200} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>
                    {isOwned && (
                        <View style={styles.ownedRow}>
                            <View style={styles.ownedDot} />
                            <Text style={styles.ownedLabel}>En biblioteca</Text>
                        </View>
                    )}
                </View>
                {isOwned ? (
                    <View style={styles.ownedBadges}>
                        {(ownedPlatforms ?? [GPlatform.STEAM]).map(p => (
                            <PlatformBadge key={p} platform={p} />
                        ))}
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.wishlistBtn, isInWishlist && styles.wishlistBtnActive]}
                        onPress={handleWishlist}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Feather
                            name="heart"
                            size={20}
                            color={isInWishlist ? colors.error : colors.textTertiary}
                        />
                    </TouchableOpacity>
                )}
            </Pressable>
        </Animated.View>
    );
});
SearchResultCard.displayName = 'SearchResultCard';

const styles = StyleSheet.create({
    cardOuter: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        overflow: 'hidden',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    coverWrap: {
        margin: spacing.sm,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    cover: {
        width: 56,
        height: 75,
        backgroundColor: colors.surfaceElevated,
    },
    info: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingRight: spacing.sm,
    },
    title: {
        ...typography.body,
        fontWeight: '600',
        lineHeight: 20,
    },
    ownedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: spacing.xs,
    },
    ownedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    ownedLabel: {
        ...typography.small,
        color: colors.success,
        fontWeight: '600',
    },
    wishlistBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        borderRadius: radius.full,
    },
    wishlistBtnActive: {
        backgroundColor: colors.errorBackground,
    },
    ownedBadges: {
        paddingHorizontal: spacing.sm,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
});
