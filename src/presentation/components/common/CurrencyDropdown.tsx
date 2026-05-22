import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadows } from '../../theme/spacing';

export interface DropdownOption {
    label: string;
    value: string;
}

export interface CurrencyDropdownProps {
    visible: boolean;
    options: DropdownOption[];
    selectedValue: string;
    onSelect: (value: string) => void;
    onClose: () => void;
}

/**
 * Inline dropdown for selecting an option from a list.
 * Positioned below the SettingRow that triggers it.
 */
export const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({
    visible,
    options,
    selectedValue,
    onSelect,
    onClose,
}) => {
    if (!visible) return null;

    return (
        <View style={styles.container}>
            {options.map((option) => {
                const isSelected = option.value === selectedValue;
                return (
                    <TouchableOpacity
                        key={option.value}
                        style={[styles.optionRow, isSelected && styles.selectedOption]}
                        onPress={() => onSelect(option.value)}
                        activeOpacity={0.6}
                    >
                        <View style={styles.optionLeft}>
                            {isSelected && (
                                <Feather name="check" size={16} color={colors.primary} />
                            )}
                            {!isSelected && <View style={{ width: 16 }} />}
                            <Text style={[typography.body, isSelected ? styles.selectedText : styles.optionLabel]}>
                                {option.label}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
    },
    container: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.medium,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    selectedOption: {
        backgroundColor: colors.primaryDim,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    optionLabel: {
        color: colors.textPrimary,
    },
    selectedText: {
        color: colors.primary,
        fontWeight: '600',
    },
});
