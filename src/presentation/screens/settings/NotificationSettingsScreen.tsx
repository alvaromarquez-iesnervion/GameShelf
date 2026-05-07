import React, { useEffect, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import { PushNotificationService } from '../../../data/services/PushNotificationService';
import { TYPES } from '../../../di/types';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { styles } from './NotificationSettingsScreen.styles';
import { Screen } from '../../components/common/Screen';

export const NotificationSettingsScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<SettingsViewModel>(TYPES.SettingsViewModel);
    const pushService = useInjection<PushNotificationService>(TYPES.PushNotificationService);
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId && !vm.profile) vm.loadProfile(userId);
    }, [userId, vm]);

    const handleToggleNotifications = useCallback(async (value: boolean) => {
        if (value && pushService.permissionState !== 'denied') {
            void pushService.initialize(userId);
        }
        void vm.updateNotificationPreferences(userId, value);
    }, [vm, userId, pushService]);

    const openSystemSettings = useCallback(async () => {
        try {
            const canOpen = await Linking.canOpenURL('app-settings:');
            if (canOpen) {
                await Linking.openURL('app-settings:');
            } else {
                await Linking.openSettings();
            }
        } catch {
            // Fallback: no action
        }
    }, []);

    const renderPermissionStatus = () => {
        if (pushService.permissionState === 'denied') {
            return (
                <View style={styles.permissionBanner}>
                    <Feather name="alert-triangle" size={16} color="#f59e0b" />
                    <Text style={styles.permissionText}>
                        Permisos de notificacion desactivados. Habilitalos en Ajustes del sistema para recibir alertas de ofertas.
                    </Text>
                    <TouchableOpacity onPress={openSystemSettings} style={styles.settingsButton}>
                        <Text style={styles.settingsButtonText}>Abrir Ajustes</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (pushService.permissionState === 'granted' && pushService.hasToken && vm.isDealsEnabled) {
            return (
                <View style={styles.permissionBannerSuccess}>
                    <Feather name="check-circle" size={16} color="#10b981" />
                    <Text style={styles.permissionTextSuccess}>Notificaciones activas</Text>
                </View>
            );
        }

        return null;
    };

    if (vm.isLoading && !vm.profile) return <ListSkeleton count={1} />;

    return (
        <Screen style={styles.container} topInset="header">
            <Text style={styles.sectionLabel}>ALERTAS</Text>

            {renderPermissionStatus()}

            <View style={styles.group}>
                <View style={styles.row}>
                    <View style={styles.iconBox}>
                        <Feather name="tag" size={18} color={colors.onPrimary} />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.rowTitle}>Ofertas de juegos</Text>
                        <Text style={styles.rowDescription}>
                            Recibe avisos cuando un juego de tu lista de deseos baje de precio
                        </Text>
                    </View>
                    <Switch
                        value={vm.isDealsEnabled}
                        onValueChange={handleToggleNotifications}
                        trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                        thumbColor={colors.onPrimary}
                        ios_backgroundColor={colors.surfaceVariant}
                    />
                </View>
            </View>

            <Text style={styles.footnote}>
                Las notificaciones se enviaran cuando un precio caiga al menos un 20% respecto al precio habitual.
            </Text>
        </Screen>
    );
});
NotificationSettingsScreen.displayName = 'NotificationSettingsScreen';
