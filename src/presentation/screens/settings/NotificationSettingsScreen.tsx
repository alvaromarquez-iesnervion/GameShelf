import React, { useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import { TYPES } from '../../../di/types';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

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
                        <Feather name="tag" size={18} color="#fff" />
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
                        thumbColor="#ffffff"
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'ios' ? 100 : 64,
        paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },
    group: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.md,
    },
    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    rowTitle: {
        ...typography.body,
        fontWeight: '500',
        marginBottom: 2,
    },
    rowDescription: {
        ...typography.small,
        color: colors.textSecondary,
        lineHeight: 17,
    },
    footnote: {
        ...typography.small,
        color: colors.textTertiary,
        marginTop: spacing.md,
        marginHorizontal: spacing.sm,
        lineHeight: 18,
    },
});
