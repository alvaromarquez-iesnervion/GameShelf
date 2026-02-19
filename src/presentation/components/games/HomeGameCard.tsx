import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface HomeGameCardProps {
    coverUrl: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    size?: 'small' | 'medium';
}

export const HomeGameCard: React.FC<HomeGameCardProps> = ({
    coverUrl,
    title,
    subtitle,
    onPress,
    size = 'medium',
}) => {
    const handlePress = () => {
        Haptics.selectionAsync();
        onPress();
    };

    const dimensions = size === 'small' 
        ? { coverWidth: 100, coverHeight: 134 }
        : { coverWidth: 120, coverHeight: 160 };

    return (
        <TouchableOpacity 
            style={[styles.card, { width: dimensions.coverWidth + spacing.md * 2 }]} 
            onPress={handlePress} 
            activeOpacity={0.75}
        >
            <Image 
                source={{ uri: coverUrl }} 
                style={[styles.cover, { width: dimensions.coverWidth, height: dimensions.coverHeight }]} 
                resizeMode="cover" 
            />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        alignItems: 'flex-start',
    },
    cover: {
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceElevated,
    },
    info: {
        marginTop: spacing.sm,
        paddingHorizontal: spacing.xs,
    },
    title: {
        ...typography.caption,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    subtitle: {
        ...typography.caption,
        color: colors.textTertiary,
        marginTop: 2,
    },
});
