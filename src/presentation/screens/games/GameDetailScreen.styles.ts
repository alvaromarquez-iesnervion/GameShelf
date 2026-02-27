import { Dimensions, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

const { width } = Dimensions.get('window');

// Carousel slide dimensions
export const SLIDE_WIDTH = width;
// Steam header.jpg is 460×215 — preserve that aspect ratio so the image
// is shown full-width without any cropping.
const HEADER_ASPECT_RATIO = 460 / 215;
export const COVER_HEIGHT = Math.round(SLIDE_WIDTH / HEADER_ASPECT_RATIO);

// Screenshot thumbnails in the carousel use a 16:9 ratio
const SCREENSHOT_ASPECT_RATIO = 16 / 9;
export const SCREENSHOT_HEIGHT = Math.round(SLIDE_WIDTH / SCREENSHOT_ASPECT_RATIO);

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },

    // ─── Carousel ────────────────────────────────────────────────────────────
    carouselContainer: {
        position: 'relative',
    },
    slide: {
        width: SLIDE_WIDTH,
        overflow: 'hidden',
    },
    coverSlide: {
        height: COVER_HEIGHT,
    },
    screenshotSlide: {
        height: SCREENSHOT_HEIGHT,
    },
    slideImage: {
        width: '100%',
        height: '100%',
    },
    carouselGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: COVER_HEIGHT * 0.7,
    },
    paginationRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        paddingTop: spacing.sm,
        paddingBottom: spacing.xs,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.textSecondary,
    },
    dotActive: {
        backgroundColor: colors.primary,
        width: 16,
    },

    // ─── Main content ─────────────────────────────────────────────────────────
    content: {
        paddingHorizontal: spacing.lg,
        marginTop: -(COVER_HEIGHT * 0.1),
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
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
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
        borderRadius: radius.md,
        padding: spacing.md,
        alignItems: 'center',
        gap: spacing.xs,
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
        borderRadius: radius.md,
        padding: spacing.md,
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
        backgroundColor: colors.surface,
        borderRadius: radius.full,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
    },
    genreChipText: {
        ...typography.caption,
        color: colors.textSecondary,
    },

    // ─── Metacritic ───────────────────────────────────────────────────────────
    metacriticBadge: {
        alignSelf: 'flex-start',
        borderRadius: radius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
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
