import React, { useEffect } from 'react';
import { View, Text, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import { TYPES } from '../../../di/types';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { styles } from './NotificationSettingsScreen.styles';

export const NotificationSettingsScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<SettingsViewModel>(TYPES.SettingsViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId && !vm.profile) vm.loadProfile(userId);
    }, [userId]);

    if (vm.isLoading && !vm.profile) return <ListSkeleton count={1} />;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionLabel}>ALERTAS</Text>

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
                        onValueChange={(value) => { void vm.updateNotificationPreferences(userId, value); }}
                        trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
                        thumbColor={colors.onPrimary}
                        ios_backgroundColor={colors.surfaceVariant}
                    />
                </View>
            </View>

            <Text style={styles.footnote}>
                Las notificaciones se enviarán cuando un precio caiga al menos un 20% respecto al precio habitual.
            </Text>
        </View>
    );
});
