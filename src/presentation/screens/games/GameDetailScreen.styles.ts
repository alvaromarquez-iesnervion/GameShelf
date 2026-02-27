import { Dimensions, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

const { width } = Dimensions.get('window');

// Steam header.jpg is 460×215 — preserve that aspect ratio so the image
// is shown full-width without any cropping.
const HEADER_ASPECT_RATIO = 460 / 215;
export const COVER_HEIGHT = Math.round(width / HEADER_ASPECT_RATIO);

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    coverContainer: {
        width: width,
        height: COVER_HEIGHT,
        position: 'relative',
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: COVER_HEIGHT * 0.7,
    },
    content: {
        paddingHorizontal: spacing.lg,
        marginTop: -(COVER_HEIGHT * 0.15),
        paddingBottom: layout.tabBarClearance,
    },
    title: {
        ...typography.heading,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
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
    section: {
        marginBottom: spacing.xl,
    },
    dealsSection: {
        marginTop: spacing.md,
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
});
