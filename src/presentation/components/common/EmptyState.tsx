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
        <View style={styles.container}>
            <View style={styles.iconWrap}>
                <Feather name={icon} size={iconSize} color={colors.textTertiary} />
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
        width: 72,
        height: 72,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    message: {
        ...typography.bodySecondary,
        textAlign: 'center',
        color: colors.textSecondary,
        maxWidth: 260,
        lineHeight: 22,
    },
});
