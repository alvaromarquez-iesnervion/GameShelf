import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInjection } from '../../../di/hooks/useInjection';
import { ProfileViewModel } from '../../viewmodels/ProfileViewModel';
import { TYPES } from '../../../di/types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { colors } from '../../theme/colors';
import { styles } from './ProfileScreen.styles';
import { spacing } from '../../theme/spacing';

export const ProfileScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const vm = useInjection<ProfileViewModel>(TYPES.ProfileViewModel);
    const user = vm.user;

    if (!user) return <LoadingSpinner message="Cargando perfil..." />;

    const initial = user.getDisplayName().charAt(0).toUpperCase();
    const memberSince = user.getCreatedAt().toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
    });

    const stats = [
        { icon: 'grid' as const, label: 'Biblioteca', value: vm.libraryCount },
        { icon: 'monitor' as const, label: 'Plataformas', value: vm.platformCount },
        { icon: 'heart' as const, label: 'Lista deseos', value: vm.wishlistCount },
    ];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: insets.top + spacing.md },
            ]}
            showsVerticalScrollIndicator={false}
        >
            {/* Hero header */}
            <LinearGradient
                colors={[colors.primaryHeroGlow, 'transparent']}
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
