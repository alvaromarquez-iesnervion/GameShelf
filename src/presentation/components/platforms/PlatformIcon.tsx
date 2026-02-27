import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { colors } from '../../theme/colors';

interface PlatformIconProps {
    platform: GamePlatform;
    /** Icon size in dp. Default: 18 */
    size?: number;
}

/**
 * Small platform logo icon for use in library cards and detail screens.
 *
 * Steam  → MaterialCommunityIcons "steam" glyph (official icon available in the set)
 * Epic   → Styled "E" badge that matches the Epic Games brand mark
 * Other  → null (renders nothing)
 */
export const PlatformIcon: React.FC<PlatformIconProps> = ({ platform, size = 18 }) => {
    if (platform === GamePlatform.STEAM) {
        return (
            <View style={[styles.container, { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 }]}>
                <MaterialCommunityIcons
                    name="steam"
                    size={size}
                    color="#fff"
                />
            </View>
        );
    }

    if (platform === GamePlatform.EPIC_GAMES) {
        const fontSize = Math.round(size * 0.72);
        return (
            <View style={[
                styles.container,
                styles.epicContainer,
                { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2 },
            ]}>
                <Text style={[styles.epicLetter, { fontSize, lineHeight: fontSize + 2 }]}>E</Text>
            </View>
        );
    }

    return null;
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    epicContainer: {
        backgroundColor: colors.epic ?? '#2563EB',
    },
    epicLetter: {
        color: '#fff',
        fontWeight: '800',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});
