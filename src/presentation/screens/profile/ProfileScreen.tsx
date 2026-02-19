import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { LibraryViewModel } from '../../viewmodels/LibraryViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { TYPES } from '../../../di/types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const ProfileScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const libraryVm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const user = authVm.currentUser;

    if (!user) return <LoadingSpinner message="Cargando perfil..." />;

    const initial = user.getDisplayName().charAt(0).toUpperCase();
    const memberSince = user.getCreatedAt().toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
    });

    const stats = [
        { icon: 'grid' as const, label: 'Biblioteca', value: libraryVm.games.length },
        { icon: 'monitor' as const, label: 'Plataformas', value: libraryVm.linkedPlatforms.length },
        { icon: 'heart' as const, label: 'Lista deseos', value: wishlistVm.items.length },
    ];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Hero header */}
            <LinearGradient
                colors={['rgba(10, 132, 255, 0.18)', 'transparent']}
                style={styles.heroGradient}
                pointerEvents="none"
            />

            <View style={styles.hero}>
                <View style={styles.avatarWrap}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarInitial}>{initial}</Text>
                    </LinearGradient>
                    <View style={styles.verifiedBadge}>
                        <Feather name="check" size={11} color="#fff" />
                    </View>
                </View>

                <Text style={styles.displayName}>{user.getDisplayName()}</Text>
                <Text style={styles.email}>{user.getEmail()}</Text>

                <View style={styles.memberRow}>
                    <Feather name="calendar" size={12} color={colors.textTertiary} />
                    <Text style={styles.memberText}>Miembro desde {memberSince}</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                {stats.map((stat, index) => (
                    <View key={stat.label} style={[styles.statCell, index < stats.length - 1 && styles.statCellBorder]}>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Feather name={stat.icon} size={14} color={colors.textTertiary} style={styles.statIcon} />
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 100 : 64,
        paddingBottom: spacing.xxl,
    },
    heroGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 320,
    },
    hero: {
        alignItems: 'center',
        paddingHorizontal: spacing.xxl,
        paddingBottom: spacing.xl,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 40,
        fontWeight: '700',
        color: '#fff',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    displayName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        letterSpacing: 0.2,
        marginBottom: spacing.xs,
    },
    email: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    memberText: {
        ...typography.caption,
        color: colors.textTertiary,
    },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    statCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    statCellBorder: {
        borderRightWidth: StyleSheet.hairlineWidth,
        borderRightColor: colors.border,
    },
    statValue: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        marginBottom: 2,
    },
    statIcon: {
        marginBottom: 2,
    },
    statLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 11,
    },
});
