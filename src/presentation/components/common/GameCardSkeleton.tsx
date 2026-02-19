import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Shimmer } from './Shimmer';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

// Matches the 2:3 poster aspect ratio used in GameCard
const CARD_WIDTH = 110;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.5);

export const GameCardSkeleton: React.FC = () => {
    return (
        <View style={styles.card}>
            <Shimmer width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={0} />
            <View style={styles.info}>
                <Shimmer width={90} height={12} borderRadius={radius.xs} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        margin: spacing.sm,
        overflow: 'hidden',
        width: CARD_WIDTH,
    },
    info: {
        padding: spacing.sm,
    },
});
