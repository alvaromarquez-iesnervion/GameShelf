import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    searchHeader: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
    },
    title: {
        ...typography.hero,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        height: 48,
    },
    searchInput: {
        flex: 1,
        ...typography.input,
        fontSize: 17,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: layout.tabBarClearance,
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.subheading,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        marginHorizontal: spacing.lg,
    },
    horizontalList: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    list: {
        paddingBottom: layout.tabBarClearance,
    },
    emptyContainer: {
        marginTop: 100,
    },
    emptySection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        padding: spacing.md,
        borderRadius: radius.lg,
        gap: spacing.sm,
    },
    emptySectionText: {
        ...typography.bodySecondary,
        color: colors.textTertiary,
        flex: 1,
    },
    emptyHome: {
        marginTop: 60,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    linkButtonText: {
        ...typography.button,
        color: colors.textPrimary,
    },
});
