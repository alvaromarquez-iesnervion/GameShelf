import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xxl,
        paddingTop: 60,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xxl,
        alignSelf: 'flex-start',
    },
    backText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: radius.xxl,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    title: {
        ...typography.subheading,
        fontSize: 26,
        letterSpacing: 0.3,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.bodySecondary,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    form: {
        gap: spacing.md,
    },
    // ── Estado éxito ──
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: spacing.xxxl,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: radius.xxl,
        backgroundColor: colors.successBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.success,
    },
    emailHighlight: {
        color: colors.primary,
        fontWeight: '600',
    },
    hintText: {
        ...typography.small,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.md,
        lineHeight: 20,
        paddingHorizontal: spacing.md,
    },
});
