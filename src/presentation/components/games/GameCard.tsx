import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';

interface GameCardProps {
    coverUrl: string;
    title: string;
    platform?: GamePlatform;
    onPress: () => void;
}

export const GameCard = React.memo(({ coverUrl, title, platform, onPress }: GameCardProps) => {
    const handlePress = () => {
        if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
        }
        onPress();
    };

    return (
        <TouchableOpacity 
            style={styles.card} 
            onPress={handlePress} 
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                <Image 
                    source={{ uri: coverUrl }} 
                    style={styles.cover} 
                    resizeMode="cover" 
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.gradient}
                />
                <View style={styles.badgeContainer}>
                    <View style={[
                        styles.platformBadge,
                        platform === GamePlatform.STEAM ? styles.steam : styles.epic,
                    ]}>
                        <View style={styles.dot} />
                    </View>
                </View>
            </View>
            <View style={styles.info}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    card: {
        width: '31%', // Proporción para 3 columnas con margen
        marginBottom: spacing.lg,
    },
    imageContainer: {
        aspectRatio: 2/3,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: colors.surface,
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
    },
    badgeContainer: {
        position: 'absolute',
        top: 6,
        right: 6,
    },
    platformBadge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    dot: {
        flex: 1,
    },
    steam: {
        backgroundColor: colors.steamAccent,
    },
    epic: {
        backgroundColor: colors.epic,
    },
    info: {
        marginTop: spacing.xs,
        paddingHorizontal: 2,
    },
    title: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: '600',
    },
});