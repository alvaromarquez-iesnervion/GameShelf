import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface DealCardProps {
    storeName: string;
    price: number;
    originalPrice: number;
    discountPercentage: number;
    url: string;
    onPress?: () => void;
}

export const DealCard: React.FC<DealCardProps> = ({
    storeName,
    price,
    originalPrice,
    discountPercentage,
    url,
    onPress,
}) => {
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Linking.openURL(url);
        onPress?.();
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.75}>
            {/* Left: store + prices */}
            <View style={styles.left}>
                <Text style={styles.storeName} numberOfLines={1}>{storeName}</Text>
                <View style={styles.priceRow}>
                    <Text style={styles.currentPrice}>${price.toFixed(2)}</Text>
                    <Text style={styles.originalPrice}>${originalPrice.toFixed(2)}</Text>
                </View>
            </View>

            {/* Right: discount badge + CTA */}
            <View style={styles.right}>
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>-{discountPercentage}%</Text>
                </View>
                <View style={styles.ctaRow}>
                    <Text style={styles.ctaText}>Ver oferta</Text>
                    <Feather name="external-link" size={12} color={colors.primary} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    left: {
        flex: 1,
        marginRight: spacing.md,
    },
    storeName: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing.sm,
    },
    currentPrice: {
        ...typography.price,
        color: colors.discount,
        fontSize: 18,
    },
    originalPrice: {
        ...typography.bodySecondary,
        textDecorationLine: 'line-through',
        fontSize: 13,
    },
    right: {
        alignItems: 'flex-end',
        gap: spacing.sm,
    },
    discountBadge: {
        backgroundColor: colors.discountBackground,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: radius.sm,
    },
    discountText: {
        ...typography.caption,
        color: colors.discount,
        fontWeight: '700',
        fontSize: 13,
    },
    ctaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ctaText: {
        ...typography.small,
        color: colors.primary,
        fontWeight: '600',
    },
});
