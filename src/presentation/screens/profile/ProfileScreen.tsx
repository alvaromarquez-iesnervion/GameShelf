import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { ProfileViewModel } from '../../viewmodels/ProfileViewModel';
import { Screen } from '../../components/common/Screen';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { strings } from '../../../core/constants/strings';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const ProfileScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<ProfileViewModel>(TYPES.ProfileViewModel);
    const [confirmLogout, setConfirmLogout] = useState(false);

    const user = authVm.currentUser;
    const isGuest = authVm.isGuest;
    const initial = (user?.getDisplayName() || user?.getEmail() || '?').charAt(0).toUpperCase();

    const onLogout = useCallback(async () => {
        setConfirmLogout(false);
        await authVm.logout();
    }, [authVm]);

    return (
        <Screen topInset="header">
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.identityCard}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>{initial}</Text>
                    </LinearGradient>
                    <Text style={styles.name} numberOfLines={1}>
                        {isGuest ? 'Invitado' : (user?.getDisplayName() || user?.getEmail() || 'Sin nombre')}
                    </Text>
                    {!isGuest && user?.getEmail() && (
                        <Text style={styles.email} numberOfLines={1}>{user.getEmail()}</Text>
                    )}
                    {isGuest && (
                        <View style={styles.guestPill}>
                            <Feather name="user" size={12} color={colors.warning} />
                            <Text style={styles.guestPillText}>Modo invitado</Text>
                        </View>
                    )}
                </View>

                <View style={styles.statsRow}>
                    <Stat label="Biblioteca" value={String(vm.libraryCount)} icon="book-open" tint={colors.primary} />
                    <Stat label="Wishlist" value={String(vm.wishlistCount)} icon="heart" tint={colors.accentWarm} />
                </View>

                <Pressable
                    style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
                    onPress={() => setConfirmLogout(true)}
                >
                    <Feather name="log-out" size={18} color={colors.error} />
                    <Text style={styles.logoutText}>
                        {isGuest ? strings.logoutGuest : strings.logoutRegistered}
                    </Text>
                </Pressable>
            </ScrollView>

            <ConfirmDialog
                visible={confirmLogout}
                title={isGuest ? strings.deleteGuestDataTitle : strings.logoutConfirmTitle}
                message={isGuest ? strings.deleteGuestDataMessage : strings.logoutConfirmMessage}
                confirmText={isGuest ? strings.deleteAll : strings.logoutRegistered}
                onConfirm={onLogout}
                onCancel={() => setConfirmLogout(false)}
                destructive
            />
        </Screen>
    );
});

const Stat: React.FC<{ label: string; value: string; icon: keyof typeof Feather.glyphMap; tint: string }> = ({
    label, value, icon, tint,
}) => (
    <View style={styles.stat}>
        <View style={[styles.statIcon, { backgroundColor: tint + '22' }]}>
            <Feather name={icon} size={16} color={tint} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const styles = StyleSheet.create({
    scroll: { padding: spacing.lg, gap: spacing.lg },
    identityCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        alignItems: 'center',
        borderWidth: 1, borderColor: colors.borderSubtle,
        gap: spacing.xs,
    },
    avatar: {
        width: 84, height: 84,
        borderRadius: radius.full,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.md,
        shadowColor: colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    avatarText: { ...typography.heading, fontSize: 36, color: colors.onPrimary },
    name: { ...typography.subheading },
    email: { ...typography.bodySecondary },
    guestPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.warningBackground,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
        marginTop: spacing.xs,
    },
    guestPillText: { ...typography.caption, color: colors.warning, fontWeight: '600' },
    statsRow: { flexDirection: 'row', gap: spacing.md },
    stat: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1, borderColor: colors.borderSubtle,
        gap: spacing.xs,
    },
    statIcon: {
        width: 36, height: 36,
        borderRadius: radius.full,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: spacing.xs,
    },
    statValue: { ...typography.heading, fontSize: 26 },
    statLabel: { ...typography.caption },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.errorBackground,
        borderColor: colors.errorBorder,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    logoutText: { ...typography.button, color: colors.error },
});
