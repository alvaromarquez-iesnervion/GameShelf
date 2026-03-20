import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Platform } from '../../../domain/enums/Platform';

interface PlatformBadgeProps {
    platform: Platform;
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform }) => {
    if (platform === Platform.UNKNOWN) return null;

    const isSteam = platform === Platform.STEAM;
    const isGog = platform === Platform.GOG;
    const isPsn = platform === Platform.PSN;

    const badgeStyle = isSteam ? styles.steam : isGog ? styles.gog : isPsn ? styles.psn : styles.epic;
    const iconName = isSteam ? 'monitor' : isGog ? 'shopping-bag' : isPsn ? 'tv' : 'box';
    const iconColor = isSteam ? colors.steamAccent : isGog ? colors.gog : isPsn ? colors.psnAccent : colors.epic;
    const textStyle = isSteam ? styles.steamText : isGog ? styles.gogText : isPsn ? styles.psnText : styles.epicText;
    const label = isSteam ? 'Steam' : isGog ? 'GOG' : isPsn ? 'PlayStation' : 'Epic Games';

    return (
        <View style={[styles.badge, badgeStyle]}>
            <Feather
                name={iconName}
                size={12}
                color={iconColor}
                style={styles.icon}
            />
            <Text style={[styles.text, textStyle]}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: radius.sm,
        alignSelf: 'flex-start',
        borderWidth: StyleSheet.hairlineWidth,
    },
    steam: {
        backgroundColor: colors.steam,
        borderColor: colors.border,
    },
    epic: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.epic,
    },
    gog: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.gog,
    },
    psn: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.psn,
    },
    icon: {
        marginRight: spacing.xs,
    },
    text: {
        ...typography.caption,
        fontWeight: '700',
    },
    steamText: {
        color: colors.steamAccent,
    },
    epicText: {
        color: colors.epic,
    },
    gogText: {
        color: colors.gog,
    },
    psnText: {
        color: colors.psnAccent,
    },
});
