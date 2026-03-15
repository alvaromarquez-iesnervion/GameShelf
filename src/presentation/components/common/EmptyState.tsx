import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface EmptyStateProps {
    message: string;
    icon?: keyof typeof Feather.glyphMap;
    iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    message,
    icon = 'inbox',
    iconSize = 32,
}) => {
    return (
        <View style={styles.container} accessibilityRole="text" accessibilityLabel={message}>
            <View style={styles.iconWrap}>
                <View style={styles.iconGlow} />
                <Feather name={icon} size={iconSize} color={colors.primary} />
            </View>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
        minHeight: 240,
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: colors.primaryDim,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        position: 'relative',
    },
    iconGlow: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: radius.full,
        backgroundColor: colors.primarySubtle,
        transform: [{ scale: 1.3 }],
    },
    message: {
        ...typography.bodySecondary,
        textAlign: 'center',
        color: colors.textSecondary,
        maxWidth: 280,
        lineHeight: 22,
    },
});
