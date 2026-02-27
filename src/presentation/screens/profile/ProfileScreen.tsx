import React from 'react';
import { View, Text, ScrollView } from 'react-native';
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
import { styles } from './ProfileScreen.styles';

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
                        <Feather name="check" size={11} color={colors.onPrimary} />
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
