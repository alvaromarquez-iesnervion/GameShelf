import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface LoadingSpinnerProps {
    size?: 'small' | 'large';
    message?: string;
    fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'large',
    message,
    fullScreen = true,
}) => {
    return (
        <View style={[styles.container, !fullScreen && styles.inline]}>
            <ActivityIndicator size={size} color={colors.primary} />
            {message && (
                <Text style={styles.message}>{message}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        gap: spacing.md,
    },
    inline: {
        flex: 0,
        padding: spacing.xl,
    },
    message: {
        ...typography.small,
        color: colors.textTertiary,
    },
});
