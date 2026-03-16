import { Dimensions, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

// Portrait-only app — rotation locked in app.json, so module-level Dimensions is safe
const { width } = Dimensions.get('window');

// Hero image dimensions — portrait ratio (2:3) for games that have portraitCoverUrl,
// falls back to landscape. We use a fixed height that works for both.
export const HERO_HEIGHT = Math.round(width * 0.6);

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollView: {
        flex: 1,
    },

    // ─── Hero image ──────────────────────────────────────────────────────────
    heroContainer: {
        width: '100%',
        height: HERO_HEIGHT,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: HERO_HEIGHT * 0.65,
    },

    // ─── Main content ─────────────────────────────────────────────────────────
    content: {
        paddingHorizontal: spacing.lg,
        marginTop: -(HERO_HEIGHT * 0.08),
        paddingBottom: layout.tabBarClearance,
    },
    title: {
        ...typography.heading,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
        alignItems: 'center',
    },
    description: {
        ...typography.bodySecondary,
        marginBottom: spacing.xl,
        lineHeight: 24,
    },
    actionRow: {
        marginBottom: spacing.xl,
    },
    wishlistBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        paddingVertical: spacing.md + 2,
        borderRadius: radius.xl,
        gap: spacing.sm,
    },
    wishlistBtnActive: {
        backgroundColor: colors.surfaceVariant,
    },
    wishlistBtnText: {
        color: colors.onPrimary,
        ...typography.button,
    },
    wishlistBtnTextActive: {
        color: colors.textPrimary,
    },

    // ─── Sections ─────────────────────────────────────────────────────────────
    section: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.title,
        color: colors.textPrimary,
    },

    // ─── Player stats ─────────────────────────────────────────────────────────
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    statValue: {
        ...typography.title,
        color: colors.textPrimary,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        textAlign: 'center',
    },

    // ─── ProtonDB ─────────────────────────────────────────────────────────────
    protonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    protonBadges: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignItems: 'center',
    },
    protonTrendingLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    protonReports: {
        ...typography.caption,
        color: colors.textSecondary,
        marginLeft: 'auto',
    },

    // ─── Game info (Steam metadata) ───────────────────────────────────────────
    infoGrid: {
        gap: spacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'flex-start',
    },
    infoLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        width: 90,
        flexShrink: 0,
    },
    infoValue: {
        ...typography.bodySecondary,
        color: colors.textPrimary,
        flex: 1,
    },
    genreRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.xs,
    },
    genreChip: {
        backgroundColor: colors.primaryDim,
        borderRadius: radius.full,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs,
    },
    genreChipText: {
        ...typography.caption,
        color: colors.primaryLight,
        fontWeight: '600',
    },

    // ─── Metacritic ───────────────────────────────────────────────────────────
    metacriticBadge: {
        alignSelf: 'flex-start',
        borderRadius: radius.md,
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs,
        marginBottom: spacing.md,
    },
    metacriticScore: {
        ...typography.title,
        fontWeight: '700',
    },
    metacriticLabel: {
        ...typography.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },

    // ─── Recommendations ──────────────────────────────────────────────────────
    recommendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },

    // ─── Deals ───────────────────────────────────────────────────────────────
    dealsSection: {
        marginTop: spacing.md,
    },
});
