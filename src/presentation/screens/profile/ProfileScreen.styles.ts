import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        paddingBottom: spacing.xxl,
    },
    heroGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 340,
    },
    hero: {
        alignItems: 'center',
        paddingHorizontal: spacing.xxl,
        paddingBottom: spacing.xl,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: spacing.lg,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.primaryRing,
    },
    avatarInitial: {
        ...typography.heroLarge,
        fontSize: 42,
        fontWeight: '700',
        color: colors.onPrimary,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    displayName: {
        ...typography.heading,
        fontSize: 26,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: 0.2,
        marginBottom: spacing.xs,
    },
    email: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.full,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    memberText: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
        overflow: 'hidden',
    },
    statCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    statCellBorder: {
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: colors.border,
    },
    statValue: {
        ...typography.heading,
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    statIcon: {
        marginBottom: spacing.xs,
    },
    statLabel: {
        ...typography.micro,
    },
});
