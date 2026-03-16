import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shimmer } from './Shimmer';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

// Matches LibraryScreen 3-column grid
const NUM_CARDS = 12;

export const LibrarySkeleton: React.FC = () => {
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = Math.floor((windowWidth - (spacing.lg * 2) - (spacing.sm * 2)) / 3);

    return (
        <View
            style={[styles.container, { paddingTop: Math.max(headerHeight, insets.top) + spacing.md }]}
            accessibilityRole="progressbar"
            accessibilityLabel="Cargando..."
        >
            {/* Large title placeholder */}
            <Shimmer width={180} height={34} borderRadius={radius.sm} style={styles.titleBar} />
            {/* Search bar placeholder */}
            <Shimmer width="100%" height={44} borderRadius={22} style={styles.searchBar} />
            {/* Grid */}
            <View style={styles.grid}>
                {Array.from({ length: NUM_CARDS }).map((_, i) => (
                    <View key={i} style={[styles.cardWrap, { width: cardWidth }]}>
                        <Shimmer width="100%" height="100%" borderRadius={radius.md} style={styles.cover} />
                        <Shimmer width="70%" height={11} borderRadius={radius.xs} style={styles.titleShimmer} />
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: spacing.lg,
    },
    titleBar: {
        marginBottom: spacing.md,
    },
    searchBar: {
        marginBottom: spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    cardWrap: {
        aspectRatio: 2 / 3,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        marginBottom: spacing.sm,
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    titleShimmer: {
        marginTop: spacing.xs,
        marginHorizontal: spacing.xs,
    },
});
