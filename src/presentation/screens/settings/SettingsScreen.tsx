import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
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
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

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
            <View style={[styles.iconBox, { backgroundColor: color || colors.surfaceElevated }]}>
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
                        color="#FF3B30"
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
                        color="#5856D6"
                    />
                    <SettingRow 
                        label="Privacidad" 
                        icon="lock" 
                        onPress={() => {}} 
                        color="#34C759"
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, marginBottom: spacing.lg },
    largeTitle: { ...typography.hero, color: colors.textPrimary },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        padding: spacing.md,
        borderRadius: radius.lg,
        marginBottom: spacing.xl,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 24, fontWeight: '700', color: colors.onPrimary },
    profileInfo: { flex: 1, marginLeft: spacing.md },
    profileName: { ...typography.title, color: colors.textPrimary },
    profileEmail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.label, marginLeft: spacing.xl, marginBottom: spacing.sm, color: colors.textTertiary },
    group: {
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        borderRadius: radius.lg,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    rowLabel: { ...typography.body, color: colors.textPrimary },
    logoutBtn: {
        marginHorizontal: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    logoutText: { ...typography.button, color: colors.error },
    version: {
        ...typography.caption,
        textAlign: 'center',
        marginTop: spacing.xxl,
        marginBottom: spacing.xxxl,
        color: colors.textTertiary,
    }
});
