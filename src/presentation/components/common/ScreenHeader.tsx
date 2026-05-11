import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ScreenHeaderProps {
    eyebrow: string;
    eyebrowColor?: string;
    title: string;
    rightSlot?: React.ReactNode;
    paddingHorizontal?: number;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    eyebrow,
    eyebrowColor = colors.secondary,
    title,
    rightSlot,
    paddingHorizontal = spacing.lg,
}) => {
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop: insets.top + spacing.md,
                    paddingHorizontal,
                },
            ]}
        >
            <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
            <View style={styles.titleRow}>
                <Text style={styles.title}>{title}</Text>
                {rightSlot && <View style={styles.rightSlot}>{rightSlot}</View>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: spacing.md,
    },
    eyebrow: {
        ...typography.label,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    title: {
        ...typography.largeTitle,
    },
    rightSlot: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
});
