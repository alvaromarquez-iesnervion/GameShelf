import { Platform, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: Platform.OS === 'ios'
            ? layout.safeAreaPaddingTop.ios
            : layout.safeAreaPaddingTop.android,
        marginBottom: spacing.lg,
    },
    largeTitle: {
        ...typography.hero,
        color: colors.textPrimary,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        padding: spacing.lg,
        borderRadius: radius.xl,
        marginBottom: spacing.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.onPrimary,
    },
    profileInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    profileName: {
        ...typography.title,
        color: colors.textPrimary,
    },
    profileEmail: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.label,
        marginLeft: spacing.xl,
        marginBottom: spacing.sm,
        color: colors.textTertiary,
    },
    group: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        borderRadius: radius.xl,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    rowLast: {
        borderBottomWidth: 0,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    rowLabel: {
        ...typography.body,
        color: colors.textPrimary,
    },
    logoutBtn: {
        marginHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        alignItems: 'center',
        marginTop: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    logoutText: {
        ...typography.button,
        color: colors.error,
    },
    version: {
        ...typography.caption,
        textAlign: 'center',
        marginTop: spacing.xxl,
        marginBottom: spacing.xxxl,
        color: colors.textDisabled,
    },
});
