import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xxl,
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
        padding: spacing.md,
        borderRadius: radius.lg,
        marginBottom: spacing.xl,
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
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 0.5,
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
        borderRadius: 8,
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
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        alignItems: 'center',
        marginTop: spacing.md,
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
        color: colors.textTertiary,
    },
});
