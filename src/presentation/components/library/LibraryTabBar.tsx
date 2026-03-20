import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LibraryTab } from '../../../domain/enums/LibraryTab';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

interface LibraryTabBarProps {
    activeTab: LibraryTab;
    pcCount: number;
    consoleCount: number;
    onTabChange: (tab: LibraryTab) => void;
}

export const LibraryTabBar: React.FC<LibraryTabBarProps> = ({
    activeTab,
    pcCount,
    consoleCount,
    onTabChange,
}) => {
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.tab, activeTab === LibraryTab.PC && styles.tabActive]}
                onPress={() => onTabChange(LibraryTab.PC)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === LibraryTab.PC }}
            >
                <Text style={[styles.tabText, activeTab === LibraryTab.PC && styles.tabTextActive]}>
                    PC
                </Text>
                {pcCount > 0 && (
                    <View style={[styles.badge, activeTab === LibraryTab.PC && styles.badgeActive]}>
                        <Text style={[styles.badgeText, activeTab === LibraryTab.PC && styles.badgeTextActive]}>
                            {pcCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeTab === LibraryTab.CONSOLE && styles.tabActive]}
                onPress={() => onTabChange(LibraryTab.CONSOLE)}
                activeOpacity={0.8}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === LibraryTab.CONSOLE }}
            >
                <Text style={[styles.tabText, activeTab === LibraryTab.CONSOLE && styles.tabTextActive]}>
                    Consola
                </Text>
                {consoleCount > 0 && (
                    <View style={[styles.badge, activeTab === LibraryTab.CONSOLE && styles.badgeActive]}>
                        <Text style={[styles.badgeText, activeTab === LibraryTab.CONSOLE && styles.badgeTextActive]}>
                            {consoleCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: 4,
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        gap: spacing.xs,
    },
    tabActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        ...typography.bodySecondary,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: colors.onPrimary,
    },
    badge: {
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.full,
        paddingHorizontal: 6,
        paddingVertical: 1,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
    badgeText: {
        ...typography.micro,
        color: colors.textTertiary,
        fontWeight: '700',
    },
    badgeTextActive: {
        color: colors.onPrimary,
    },
});
