import { Platform, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    backBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? layout.authHeaderTop.ios : layout.authHeaderTop.android,
        left: spacing.lg,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
        paddingTop: Platform.OS === 'ios' ? 120 : 80,
        paddingBottom: spacing.xxl,
    },
    headingSection: {
        marginBottom: spacing.xxl,
    },
    title: {
        ...typography.hero,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
    },
    form: {
        gap: spacing.md,
    },
});
