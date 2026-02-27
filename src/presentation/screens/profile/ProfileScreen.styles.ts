import { Platform, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios'
            ? layout.safeAreaPaddingTop.ios
            : layout.safeAreaPaddingTop.android,
        paddingBottom: spacing.xxl,
    },
    heroGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 320,
    },
    hero: {
        alignItems: 'center',
        paddingHorizontal: spacing.xxl,
        paddingBottom: spacing.xl,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 40,
        fontWeight: '700',
        color: colors.onPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    displayName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        letterSpacing: 0.2,
        marginBottom: spacing.xs,
    },
    email: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
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
        borderColor: colors.border,
        overflow: 'hidden',
    },
    statCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    statCellBorder: {
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: colors.border,
    },
    statValue: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        marginBottom: 2,
    },
    statIcon: {
        marginBottom: 2,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 11,
    },
});
