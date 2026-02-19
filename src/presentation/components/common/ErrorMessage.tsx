import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconWrap}>
                <Feather name="alert-circle" size={28} color={colors.error} />
            </View>
            <Text style={styles.title}>Algo fue mal</Text>
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
                    <Feather name="refresh-cw" size={15} color={colors.onPrimary} />
                    <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
        backgroundColor: colors.background,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: radius.full,
        backgroundColor: colors.errorBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.errorBorder,
    },
    title: {
        ...typography.subheading,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    message: {
        ...typography.body,
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.textSecondary,
        maxWidth: 300,
        lineHeight: 22,
    },
    retryBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: 12,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    retryText: {
        ...typography.button,
        color: colors.onPrimary,
    },
});
