import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Shimmer } from './Shimmer';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

export const DetailSkeleton: React.FC = () => {
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Immersive cover placeholder — matches GameDetailScreen 450px height */}
            <Shimmer width="100%" height={450} borderRadius={0} />
            <View style={styles.content}>
                {/* Title */}
                <Shimmer width={260} height={26} borderRadius={radius.sm} style={styles.mb8} />
                {/* Badges row */}
                <View style={styles.row}>
                    <Shimmer width={80} height={22} borderRadius={radius.full} style={styles.mr8} />
                    <Shimmer width={70} height={22} borderRadius={radius.full} style={styles.mr8} />
                    <Shimmer width={60} height={22} borderRadius={radius.full} />
                </View>
                {/* Description lines */}
                <Shimmer width="100%" height={14} borderRadius={radius.xs} style={styles.mt16} />
                <Shimmer width="90%" height={14} borderRadius={radius.xs} style={styles.mt6} />
                <Shimmer width="75%" height={14} borderRadius={radius.xs} style={styles.mt6} />
                {/* HLTB block */}
                <Shimmer width="100%" height={90} borderRadius={radius.lg} style={styles.mt20} />
                {/* Deals block */}
                <Shimmer width="100%" height={72} borderRadius={radius.lg} style={styles.mt12} />
                <Shimmer width="100%" height={72} borderRadius={radius.lg} style={styles.mt8} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
    },
    row: {
        flexDirection: 'row',
        marginTop: spacing.md,
        flexWrap: 'wrap',
    },
    mb8: { marginBottom: spacing.sm },
    mr8: { marginRight: spacing.sm },
    mt6: { marginTop: 6 },
    mt12: { marginTop: spacing.sm },
    mt16: { marginTop: spacing.md },
    mt20: { marginTop: 20 },
    mt8: { marginTop: spacing.sm },
});
