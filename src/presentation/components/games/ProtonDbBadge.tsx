import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface ProtonDbBadgeProps {
    rating: string | null;
}

const getRatingColor = (rating: string | null): string => {
    if (!rating) return colors.textTertiary;
    const r = rating.toLowerCase();
    switch (r) {
        case 'platinum': return colors.protonPlatinum;
        case 'gold': return colors.protonGold;
        case 'silver': return colors.protonSilver;
        case 'bronze': return colors.protonBronze;
        case 'borked': return colors.protonBorked;
        default: return colors.textTertiary;
    }
};

const getRatingIcon = (rating: string | null): keyof typeof Feather.glyphMap => {
    if (!rating) return 'help-circle';
    const r = rating.toLowerCase();
    switch (r) {
        case 'platinum':
        case 'gold':
        case 'silver':
        case 'bronze': return 'check-circle';
        case 'borked': return 'x-circle';
        default: return 'help-circle';
    }
};

export const ProtonDbBadge: React.FC<ProtonDbBadgeProps> = ({ rating }) => {
    const color = getRatingColor(rating);
    const icon = getRatingIcon(rating);
    const displayText = rating 
        ? rating.charAt(0).toUpperCase() + rating.slice(1).toLowerCase()
        : 'Sin datos';

    return (
        <View style={[styles.badge, { borderColor: color }]}>
            <Feather name={icon} size={12} color={color} style={styles.icon} />
            <Text style={[styles.text, { color }]}>{displayText}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
        borderWidth: 1,
        alignSelf: 'flex-start',
        backgroundColor: 'transparent',
    },
    icon: {
        marginRight: spacing.xs,
    },
    text: {
        ...typography.caption,
        fontWeight: '700',
    },
});