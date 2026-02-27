import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Platform as PlatformEnum } from '../../../domain/enums/Platform';
import { PlatformBadge } from './PlatformBadge';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export interface PlatformRowProps {
    platform: PlatformEnum;
    linked: boolean;
    loading: boolean;
    onLink: () => void;
    onUnlink: () => void;
}

export const PlatformRow: React.FC<PlatformRowProps> = ({
    platform,
    linked,
    loading,
    onLink,
    onUnlink,
}) => (
    <View style={styles.row}>
        <PlatformBadge platform={platform} />
        <View style={styles.rowMeta}>
            <Text style={linked ? styles.statusLinked : styles.statusUnlinked}>
                {linked ? 'Vinculado' : 'No vinculado'}
            </Text>
        </View>
        <TouchableOpacity
            style={[styles.actionBtn, linked ? styles.unlinkBtn : styles.linkBtn]}
            onPress={linked ? onUnlink : onLink}
            disabled={loading}
            activeOpacity={0.75}
        >
            <Feather
                name={linked ? 'link-2' : 'link'}
                size={14}
                color={linked ? colors.error : colors.onPrimary}
            />
            <Text style={[styles.actionText, linked && styles.unlinkText]}>
                {linked ? 'Desvincular' : 'Vincular'}
            </Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },
    rowMeta: {
        flex: 1,
        marginLeft: spacing.md,
    },
    statusLinked: {
        ...typography.small,
        color: colors.success,
        fontWeight: '600',
    },
    statusUnlinked: {
        ...typography.small,
        color: colors.textTertiary,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
    },
    linkBtn: {
        backgroundColor: colors.primary,
    },
    unlinkBtn: {
        backgroundColor: colors.errorBackground,
        borderWidth: 1,
        borderColor: colors.errorBorder,
    },
    actionText: {
        ...typography.buttonSmall,
        color: colors.onPrimary,
        fontSize: 13,
    },
    unlinkText: {
        color: colors.error,
    },
});
