import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    group: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    rowTitle: {
        ...typography.body,
        fontWeight: '500',
        marginBottom: 2,
    },
    rowDescription: {
        ...typography.small,
        color: colors.textSecondary,
        lineHeight: 17,
    },
    footnote: {
        ...typography.small,
        color: colors.textTertiary,
        marginTop: spacing.md,
        marginHorizontal: spacing.sm,
        lineHeight: 18,
    },
    permissionBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fef3c7',
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    permissionText: {
        ...typography.small,
        color: '#92400e',
        flex: 1,
        lineHeight: 18,
    },
    settingsButton: {
        backgroundColor: '#f59e0b',
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    settingsButtonText: {
        ...typography.small,
        color: '#fff',
        fontWeight: '600',
    },
    permissionBannerSuccess: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1fae5',
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    permissionTextSuccess: {
        ...typography.small,
        color: '#065f46',
        fontWeight: '500',
    },
});
