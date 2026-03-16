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
        height: 220,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    titleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    largeTitle: {
        ...typography.largeTitle,
    },
    countBadge: {
        backgroundColor: colors.primary,
        borderRadius: radius.full,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: 2,
        minWidth: 28,
        alignItems: 'center',
    },
    countText: {
        ...typography.caption,
        fontWeight: '800',
        color: colors.onPrimary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.lg,
        height: 44,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtleLight,
    },
    searchInput: {
        flex: 1,
        ...typography.inputLarge,
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
    sortBar: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 3,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    sortChipActive: {
        backgroundColor: colors.primaryMedium,
        borderColor: colors.primaryBorder,
    },
    sortChipText: {
        ...typography.caption,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    sortChipTextActive: {
        color: colors.primary,
    },
});
