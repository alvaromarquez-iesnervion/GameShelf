import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface SearchResultCardProps {
    coverUrl: string;
    title: string;
    isInWishlist: boolean;
    onPress: () => void;
    onToggleWishlist: () => void;
}

export const SearchResultCard = React.memo(({ coverUrl, title, isInWishlist, onPress, onToggleWishlist }: SearchResultCardProps) => {
    const handleWishlist = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggleWishlist();
    };

    const handlePress = () => {
        Haptics.selectionAsync();
        onPress();
    };

    return (
        <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.75}>
            <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={2}>{title}</Text>
            </View>
            <TouchableOpacity
                style={[styles.wishlistBtn, isInWishlist && styles.wishlistBtnActive]}
                onPress={handleWishlist}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Feather
                    name="heart"
                    size={20}
                    color={isInWishlist ? colors.error : colors.textTertiary}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
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
    cover: {
        width: 56,
        height: 75,
        margin: spacing.sm,
        borderRadius: radius.sm,
        backgroundColor: colors.surfaceElevated,
    },
    info: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingRight: spacing.sm,
    },
    title: {
        ...typography.body,
        fontWeight: '500',
        lineHeight: 20,
    },
    wishlistBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
        borderRadius: radius.full,
    },
    wishlistBtnActive: {
        backgroundColor: colors.errorBackground,
    },
});