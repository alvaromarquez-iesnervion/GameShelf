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
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },
    tagline: {
        ...typography.bodySecondary,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    form: {
        gap: spacing.md,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        paddingVertical: spacing.xs,
    },
    forgotText: {
        ...typography.small,
        color: colors.primary,
    },
});
