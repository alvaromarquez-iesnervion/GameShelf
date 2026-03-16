import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, layout } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    listContent: {
        paddingBottom: layout.tabBarClearance,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
        marginBottom: spacing.sm,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.textTertiary,
        opacity: 0.35,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.largeTitle,
    },
    count: {
        ...typography.bodySecondary,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
});
