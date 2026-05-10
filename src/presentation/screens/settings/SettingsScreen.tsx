import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { GameDetailViewModel } from '../../viewmodels/GameDetailViewModel';
import { SettingsStackParamList } from '../../../core/navigation/navigationTypes';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { BrandAura } from '../../components/common/BrandAura';
import { CurrencyDropdown } from '../../components/common/CurrencyDropdown';
import {
    ICountryPreferenceService,
    SUPPORTED_COUNTRIES,
} from '../../../domain/interfaces/usecases/settings/ICountryPreferenceService';
import { strings } from '../../../core/constants/strings';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

interface RowConfig {
    icon: keyof typeof Feather.glyphMap;
    tint: string;
    title: string;
    hint: string;
    route: keyof SettingsStackParamList;
}

const ROWS: RowConfig[] = [
    { icon: 'user', tint: colors.primary, title: 'Perfil', hint: 'Cuenta y estadísticas', route: 'Profile' },
    { icon: 'link', tint: colors.secondary, title: 'Plataformas', hint: 'Steam, Epic, GOG, PlayStation', route: 'PlatformLink' },
    { icon: 'bell', tint: colors.accentWarm, title: 'Notificaciones', hint: 'Avisos de ofertas en tu wishlist', route: 'NotificationSettings' },
    { icon: 'shield', tint: colors.success, title: 'Privacidad', hint: 'Datos y eliminación de cuenta', route: 'Privacy' },
];

export const SettingsScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const gameDetailVm = useInjection<GameDetailViewModel>(TYPES.GameDetailViewModel);
    const countryPrefs = useInjection<ICountryPreferenceService>(TYPES.ICountryPreferenceService);

    const [confirmLogout, setConfirmLogout] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);

    const user = authVm.currentUser;
    const isGuest = authVm.isGuest;
    const initial = (user?.getDisplayName() || user?.getEmail() || '?').charAt(0).toUpperCase();

    useEffect(() => {
        countryPrefs.loadSavedPreference().catch(() => {});
    }, [countryPrefs]);

    const currencyOptions = useMemo(
        () => SUPPORTED_COUNTRIES.map((c) => ({
            value: c.code,
            label: `${c.label} · ${c.currency}`,
        })),
        [],
    );
    const currentCountry = countryPrefs.effectiveCountry;
    const currentOption = countryPrefs.getCountryOption(currentCountry);

    const onSelectCountry = useCallback(async (code: string) => {
        setCurrencyOpen(false);
        if (code === currentCountry) return;
        try {
            await countryPrefs.setCountryAndSync(code);
            await wishlistVm.reloadWithCountry();
            await gameDetailVm.reloadWithCountry();
        } catch {
            // Si el sync remoto falla la preferencia local ya quedó aplicada.
        }
    }, [countryPrefs, currentCountry, wishlistVm, gameDetailVm]);

    const onLogout = useCallback(async () => {
        setConfirmLogout(false);
        await authVm.logout();
    }, [authVm]);

    return (
        <View style={styles.container}>
            <BrandAura style={styles.aura} />
            <ScrollView
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: insets.top + spacing.md, paddingBottom: 100 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.eyebrow}>Ajustes</Text>
                <Text style={styles.heading}>{strings.settingsTitle}</Text>

                <Pressable
                    onPress={() => navigation.navigate('Profile')}
                    style={({ pressed }) => [styles.identity, pressed && { opacity: 0.85 }]}
                >
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>{initial}</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.identityName} numberOfLines={1}>
                            {isGuest ? 'Modo invitado' : (user?.getDisplayName() || user?.getEmail() || 'Sin nombre')}
                        </Text>
                        <Text style={styles.identityHint} numberOfLines={1}>
                            {isGuest ? 'Crea una cuenta para sincronizar tus datos' : (user?.getEmail() ?? 'Ver perfil completo')}
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </Pressable>

                <Text style={styles.groupLabel}>Preferencias</Text>
                <View style={styles.group}>
                    <Pressable
                        onPress={() => setCurrencyOpen((v) => !v)}
                        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                    >
                        <View style={[styles.iconBox, { backgroundColor: colors.primary + '22' }]}>
                            <Feather name="dollar-sign" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>{strings.preferredCurrency}</Text>
                            <Text style={styles.rowHint}>
                                {currentOption.label} · {currentOption.currency}
                            </Text>
                        </View>
                        <Feather
                            name={currencyOpen ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={colors.textTertiary}
                        />
                    </Pressable>
                    <CurrencyDropdown
                        visible={currencyOpen}
                        options={currencyOptions}
                        selectedValue={currentCountry}
                        onSelect={onSelectCountry}
                        onClose={() => setCurrencyOpen(false)}
                    />
                </View>

                <Text style={styles.groupLabel}>General</Text>
                <View style={styles.group}>
                    {ROWS.map((row, i) => (
                        <React.Fragment key={row.route}>
                            <Row
                                config={row}
                                onPress={() => navigation.navigate(row.route as any)}
                            />
                            {i < ROWS.length - 1 && <View style={styles.sep} />}
                        </React.Fragment>
                    ))}
                </View>

                <Pressable
                    onPress={() => setConfirmLogout(true)}
                    style={({ pressed }) => [styles.logout, pressed && { opacity: 0.85 }]}
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
        </View>
    );
});

const Row: React.FC<{ config: RowConfig; onPress: () => void }> = ({ config, onPress }) => (
    <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
        <View style={[styles.iconBox, { backgroundColor: config.tint + '22' }]}>
            <Feather name={config.icon} size={18} color={config.tint} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{config.title}</Text>
            <Text style={styles.rowHint}>{config.hint}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textTertiary} />
    </Pressable>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 240 },
    scroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
    eyebrow: { ...typography.label, color: colors.secondary },
    heading: { ...typography.largeTitle, marginBottom: spacing.lg, marginTop: 2 },
    identity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1, borderColor: colors.borderSubtle,
    },
    avatar: {
        width: 52, height: 52,
        borderRadius: radius.full,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { ...typography.subheading, color: colors.onPrimary },
    identityName: { ...typography.body, fontWeight: '600' },
    identityHint: { ...typography.caption, marginTop: 2 },
    groupLabel: { ...typography.label, marginTop: spacing.xs, marginLeft: spacing.xs },
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
        padding: spacing.md,
    },
    rowPressed: { backgroundColor: colors.surfacePressed },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginLeft: spacing.xl + spacing.md },
    iconBox: {
        width: 36, height: 36,
        borderRadius: radius.md,
        alignItems: 'center', justifyContent: 'center',
    },
    rowTitle: { ...typography.body, fontWeight: '600' },
    rowHint: { ...typography.caption, marginTop: 2 },
    logout: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.errorBackground,
        borderColor: colors.errorBorder,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginTop: spacing.md,
    },
    logoutText: { ...typography.button, color: colors.error },
});
