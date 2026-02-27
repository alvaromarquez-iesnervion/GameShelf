import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export interface LinkStepProps {
    number: number;
    text: string;
}

export const LinkStep: React.FC<LinkStepProps> = ({ number, text }) => (
    <View style={styles.stepRow}>
        <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{number}</Text>
        </View>
        <Text style={styles.stepText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        ...typography.small,
        color: colors.onPrimary,
        fontWeight: '600',
    },
    stepText: {
        ...typography.small,
        color: colors.textSecondary,
        flex: 1,
        paddingTop: spacing.xs,
        lineHeight: 18,
    },
});
