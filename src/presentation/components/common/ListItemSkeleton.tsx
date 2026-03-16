import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shimmer } from './Shimmer';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

export const ListItemSkeleton: React.FC = () => {
    return (
        <View style={styles.card} accessibilityRole="progressbar" accessibilityLabel="Cargando...">
            <Shimmer width={72} height={96} borderRadius={0} />
            <View style={styles.info}>
                <Shimmer width={160} height={14} borderRadius={radius.xs} />
                <Shimmer width={100} height={11} borderRadius={radius.xs} style={styles.second} />
            </View>
        </View>
    );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: Math.max(headerHeight, insets.top) + spacing.md }]}>
            <View style={styles.headerPlaceholder}>
                <Shimmer width={200} height={34} borderRadius={radius.sm} />
                <Shimmer width={80} height={14} borderRadius={radius.xs} style={styles.headerSub} />
            </View>
            {Array.from({ length: count }).map((_, i) => (
                <ListItemSkeleton key={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    headerPlaceholder: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    headerSub: {
        marginTop: spacing.xs,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        overflow: 'hidden',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
    },
    info: {
        flex: 1,
        padding: spacing.md,
    },
    second: {
        marginTop: spacing.sm,
    },
});
