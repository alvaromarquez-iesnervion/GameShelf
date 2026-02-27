import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface WishlistGameCardProps {
    coverUrl: string;
    title: string;
    discountPercentage?: number | null;
    onPress: () => void;
    onRemove: () => void;
}

export const WishlistGameCard = React.memo(({ coverUrl, title, discountPercentage, onPress, onRemove }: WishlistGameCardProps) => {
    const hasDiscount = discountPercentage && discountPercentage > 0;

    const handleRemove = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onRemove();
    };

    const handlePress = () => {
        Haptics.selectionAsync();
        onPress();
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.75}>
            <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />

            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                {hasDiscount ? (
                    <View style={styles.discountBadge}>
                        <Feather name="tag" size={11} color={colors.discount} />
                        <Text style={styles.discountText}>-{discountPercentage}%</Text>
                    </View>
                ) : (
                    <Text style={styles.noDiscount}>Sin ofertas activas</Text>
                )}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.chevronBtn}
                    onPress={handlePress}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={handleRemove}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Feather name="trash-2" size={18} color={colors.error} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        borderRadius: radius.lg,
        overflow: 'hidden',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    cover: {
        width: 72,
        height: 96,
        backgroundColor: colors.surfaceElevated,
    },
    info: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    title: {
        ...typography.body,
        fontWeight: '500',
        marginBottom: spacing.xs,
        lineHeight: 20,
    },
    discountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.discountBackground,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.sm,
        alignSelf: 'flex-start',
        gap: 4,
    },
    discountText: {
        ...typography.caption,
        color: colors.discount,
        fontWeight: '700',
    },
    noDiscount: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    actions: {
        paddingRight: spacing.md,
        gap: spacing.md,
        alignItems: 'center',
    },
    chevronBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.errorBackground,
        borderRadius: radius.sm,
    },
});