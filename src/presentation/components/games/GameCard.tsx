import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { PlatformIcon } from '../platforms/PlatformIcon';

interface GameCardProps {
    coverUrl: string;
    portraitCoverUrl?: string;
    title: string;
    platform?: GamePlatform;
    onPress: () => void;
}

export const GameCard = React.memo(({ coverUrl, portraitCoverUrl, title, platform, onPress }: GameCardProps) => {
    const imageSource = portraitCoverUrl || coverUrl;
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
                    source={{ uri: imageSource }} 
                    style={styles.cover} 
                    contentFit="cover"
                    transition={200}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.gradient}
                />
                {platform !== undefined && platform !== GamePlatform.UNKNOWN && (
                    <View style={styles.badgeContainer}>
                        <PlatformIcon platform={platform} size={16} />
                    </View>
                )}
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