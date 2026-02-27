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

    return (
        <View style={[styles.badge, isSteam ? styles.steam : styles.epic]}>
            <Feather 
                name={isSteam ? 'monitor' : 'box'} 
                size={12} 
                color={isSteam ? colors.steamAccent : colors.epic} 
                style={styles.icon}
            />
            <Text style={[styles.text, isSteam ? styles.steamText : styles.epicText]}>
                {isSteam ? 'Steam' : 'Epic Games'}
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
        borderWidth: 1,
    },
    steam: {
        backgroundColor: colors.steam,
        borderColor: colors.border,
    },
    epic: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.epic,
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
});