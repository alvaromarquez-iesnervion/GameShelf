import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { LibraryTab } from '../../../domain/enums/LibraryTab';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const PLATFORM_CONFIG: Record<GamePlatform, { label: string; icon: React.ComponentProps<typeof Feather>['name'] }> = {
    [GamePlatform.STEAM]: { label: 'Steam', icon: 'monitor' },
    [GamePlatform.EPIC_GAMES]: { label: 'Epic', icon: 'shopping-bag' },
    [GamePlatform.GOG]: { label: 'GOG', icon: 'star' },
    [GamePlatform.PSN]: { label: 'PSN', icon: 'tv' },
    [GamePlatform.UNKNOWN]: { label: 'Unknown', icon: 'help-circle' },
};

const PLATFORM_ORDER: GamePlatform[] = [GamePlatform.STEAM, GamePlatform.EPIC_GAMES, GamePlatform.GOG, GamePlatform.PSN];

export const PlatformFilterChips: React.FC<{
    activeTab: LibraryTab;
    selectedPlatforms: GamePlatform[];
    onTogglePlatform: (platform: GamePlatform) => void;
}> = ({ activeTab, selectedPlatforms, onTogglePlatform }) => {
    const tabPlatforms = activeTab === LibraryTab.PC
        ? [GamePlatform.STEAM, GamePlatform.EPIC_GAMES, GamePlatform.GOG]
        : [GamePlatform.PSN];

    return (
        <View style={styles.container}>
            {PLATFORM_ORDER.filter(p => tabPlatforms.includes(p)).map(platform => {
                const config = PLATFORM_CONFIG[platform];
                const isSelected = selectedPlatforms.includes(platform);
                return (
                    <TouchableOpacity
                        key={platform}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => onTogglePlatform(platform)}
                        activeOpacity={0.7}
                    >
                        <Feather
                            name={config.icon}
                            size={12}
                            color={isSelected ? colors.onPrimary : colors.textTertiary}
                        />
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {config.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs + 2,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    chipActive: {
        backgroundColor: colors.primaryMedium,
        borderColor: colors.primaryBorder,
    },
    chipText: {
        ...typography.caption,
        color: colors.textTertiary,
        fontWeight: '600',
    },
    chipTextActive: {
        color: colors.onPrimary,
    },
});
