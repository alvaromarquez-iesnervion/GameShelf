import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface HltbInfoProps {
    main: number | null;
    mainExtra: number | null;
    completionist: number | null;
}

const formatHours = (hours: number | null): string => {
    if (hours === null || hours === undefined) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

interface HltbPillProps {
    label: string;
    value: string;
}

const HltbPill: React.FC<HltbPillProps> = ({ label, value }) => (
    <View style={styles.pill}>
        <Text style={styles.pillValue}>{value}</Text>
        <Text style={styles.pillLabel}>{label}</Text>
    </View>
);

export const HltbInfo: React.FC<HltbInfoProps> = ({ main, mainExtra, completionist }) => {
    const hasAnyData = main !== null || mainExtra !== null || completionist !== null;

    if (!hasAnyData) {
        return (
            <View style={styles.empty}>
                <Feather name="clock" size={16} color={colors.textTertiary} />
                <Text style={styles.emptyText}>Sin datos de duración</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Feather name="clock" size={15} color={colors.textSecondary} />
                <Text style={styles.headerTitle}>Tiempo de juego estimado</Text>
            </View>
            <View style={styles.pillRow}>
                <HltbPill label="Historia" value={formatHours(main)} />
                <View style={styles.pillDivider} />
                <HltbPill label="Principal + Extras" value={formatHours(mainExtra)} />
                <View style={styles.pillDivider} />
                <HltbPill label="Completista" value={formatHours(completionist)} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        gap: spacing.xs,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pillRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    pill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    pillDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    pillValue: {
        ...typography.subheading,
        color: colors.textPrimary,
        fontWeight: '600',
        marginBottom: 2,
    },
    pillLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        textAlign: 'center',
        fontSize: 10,
    },
    empty: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        gap: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    emptyText: {
        ...typography.bodySecondary,
        color: colors.textTertiary,
    },
});
