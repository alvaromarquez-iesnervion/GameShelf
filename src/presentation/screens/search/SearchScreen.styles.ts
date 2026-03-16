import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    headerGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    searchHeader: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    heroTitle: {
        ...typography.heroLarge,
        marginBottom: spacing.lg,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.lg,
        height: 48,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtleLight,
    },
    searchInput: {
        flex: 1,
        ...typography.inputLarge,
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
        marginTop: spacing.xl,
    },
    horizontalList: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
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
        padding: spacing.lg,
        borderRadius: radius.xl,
        gap: spacing.md,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    emptySectionText: {
        ...typography.bodySecondary,
        color: colors.textTertiary,
        flex: 1,
    },
    emptyHome: {
        marginTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    linkButton: {
        borderRadius: radius.xl,
        overflow: 'hidden',
    },
    linkButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md + 2,
        gap: spacing.sm,
    },
    linkButtonText: {
        ...typography.button,
        color: colors.onPrimary,
        fontWeight: '700',
    },
});

