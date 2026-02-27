import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    largeTitle: {
        ...typography.hero,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 40,
    },
    searchInput: {
        flex: 1,
        ...typography.input,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    list: {
        paddingBottom: layout.tabBarClearance,
    },
    row: {
        justifyContent: 'flex-start',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    emptyContainer: {
        marginTop: 60,
    },
});
