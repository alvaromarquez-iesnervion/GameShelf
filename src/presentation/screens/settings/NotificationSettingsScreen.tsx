import React, { useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Feather } from '@expo/vector-icons';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import { Screen } from '../../components/common/Screen';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const NotificationSettingsScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<SettingsViewModel>(TYPES.SettingsViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId) vm.loadProfile(userId);
    }, [userId, vm]);

    const onToggle = useCallback(async (value: boolean) => {
        if (!userId) return;
        await vm.updateNotificationPreferences(userId, value);
    }, [userId, vm]);

    if (vm.isLoading && !vm.profile) return <ListSkeleton count={3} />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={() => vm.loadProfile(userId)} />;

    const dealsEnabled = vm.profile?.notificationPreferences?.getDealsEnabled() ?? false;

    return (
        <Screen topInset="header">
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.intro}>
                    Te avisaremos cuando los juegos de tu wishlist bajen de precio. Puedes pausar las
                    notificaciones cuando quieras.
                </Text>

                <View style={styles.group}>
                    <View style={styles.row}>
                        <View style={styles.iconBox}>
                            <Feather name="tag" size={18} color={colors.primary} />
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>Ofertas de wishlist</Text>
                            <Text style={styles.rowHint}>Aviso cuando un juego guardado entra en oferta.</Text>
                        </View>
                        <Switch
                            value={dealsEnabled}
                            onValueChange={onToggle}
                            disabled={vm.isLoading}
                            trackColor={{ false: colors.surfaceVariant, true: colors.primaryDim }}
                            thumbColor={dealsEnabled ? colors.primary : colors.textSecondary}
                            ios_backgroundColor={colors.surfaceVariant}
                        />
                    </View>
                </View>

                <Text style={styles.footnote}>
                    Las notificaciones funcionan mejor con la app en segundo plano. Si no las recibes, revisa
                    los permisos del sistema.
                </Text>
            </ScrollView>
        </Screen>
    );
});

const styles = StyleSheet.create({
    scroll: { padding: spacing.lg, gap: spacing.lg },
    intro: { ...typography.bodySecondary, color: colors.textPrimary },
    group: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.borderSubtle,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
    },
    iconBox: {
        width: 36, height: 36,
        borderRadius: radius.md,
        backgroundColor: colors.primaryDim,
        alignItems: 'center', justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowTitle: { ...typography.body, fontWeight: '600' },
    rowHint: { ...typography.caption, marginTop: 2 },
    footnote: { ...typography.caption, color: colors.textTertiary, textAlign: 'center' },
});
