import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import { TYPES } from '../../../di/types';
import { SettingsStackParamList } from '../../../core/navigation/navigationTypes';
import { PlatformBadge } from '../../components/platforms/PlatformBadge';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { styles } from './SettingsScreen.styles';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

const SettingRow: React.FC<{
    label: string;
    icon: keyof typeof Feather.glyphMap;
    onPress: () => void;
    color?: string;
    isLast?: boolean;
}> = ({ label, icon, onPress, color, isLast }) => (
    <TouchableOpacity
        style={[styles.row, isLast && styles.rowLast]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: color ?? colors.surfaceElevated }]}>
                <Feather name={icon} size={18} color={colors.textPrimary} />
            </View>
            <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
);

export const SettingsScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<SettingsViewModel>(TYPES.SettingsViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId) vm.loadProfile(userId);
    }, [userId]);

    if (vm.isLoading && !vm.profile) return <ListSkeleton count={4} />;

    const handleLogout = () => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Cerrar sesión', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', style: 'destructive', onPress: () => authVm.logout() },
        ]);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.largeTitle}>Ajustes</Text>
            </View>

            {/* Profile Section */}
            {vm.profile && (
                <TouchableOpacity
                    style={styles.profileCard}
                    onPress={() => navigation.navigate('Profile')}
                >
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{vm.profile.user.getDisplayName().charAt(0)}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{vm.profile.user.getDisplayName()}</Text>
                        <Text style={styles.profileEmail}>{vm.profile.user.getEmail()}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>CUENTA Y PLATAFORMAS</Text>
                <View style={styles.group}>
                    <SettingRow
                        label="Plataformas Vinculadas"
                        icon="monitor"
                        onPress={() => navigation.navigate('PlatformLink')}
                        color={colors.primary}
                    />
                    <SettingRow
                        label="Notificaciones"
                        icon="bell"
                        onPress={() => navigation.navigate('NotificationSettings')}
                        color={colors.iosRed}
                        isLast
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>SOPORTE</Text>
                <View style={styles.group}>
                    <SettingRow
                        label="Centro de Ayuda"
                        icon="help-circle"
                        onPress={() => {}}
                        color={colors.iosPurple}
                    />
                    <SettingRow
                        label="Privacidad"
                        icon="lock"
                        onPress={() => {}}
                        color={colors.iosGreen}
                        isLast
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <Text style={styles.version}>GameShelf v1.0.0 (OLED Edition)</Text>
        </ScrollView>
    );
});
