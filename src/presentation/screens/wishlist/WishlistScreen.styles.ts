import { Platform, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, layout } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        paddingTop: Platform.OS === 'ios'
            ? layout.safeAreaPaddingTop.ios
            : layout.safeAreaPaddingTop.android,
        paddingBottom: layout.tabBarClearance,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        marginBottom: spacing.sm,
    },
    title: {
        ...typography.hero,
        color: colors.textPrimary,
    },
    count: {
        ...typography.bodySecondary,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});
