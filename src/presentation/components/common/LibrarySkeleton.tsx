import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Shimmer } from './Shimmer';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

// Matches LibraryScreen 3-column grid
const NUM_CARDS = 12;

export const LibrarySkeleton: React.FC = () => {
    return (
        <View style={styles.container}>
            {/* Large title placeholder */}
            <Shimmer width={180} height={34} borderRadius={radius.sm} style={styles.titleBar} />
            {/* Search bar placeholder */}
            <Shimmer width="100%" height={44} borderRadius={22} style={styles.searchBar} />
            {/* Grid */}
            <View style={styles.grid}>
                {Array.from({ length: NUM_CARDS }).map((_, i) => (
                    <View key={i} style={styles.cardWrap}>
                        <Shimmer width="100%" height={0} borderRadius={radius.md} style={styles.cover} />
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
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'ios' ? 100 : 64,
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
        // ~1/3 width accounting for 2 gaps of spacing.sm
        width: '31%',
        aspectRatio: 2 / 3,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        marginBottom: spacing.sm,
    },
    cover: {
        // Fill using aspectRatio on cardWrap; shimmer takes full width with height=0
        // Use a large padding-based height trick is not needed — card has aspectRatio
        width: '100%',
        height: '80%',
    },
    titleShimmer: {
        marginTop: spacing.xs,
        marginHorizontal: spacing.xs,
    },
});
