import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import { TYPES } from '../../../di/types';
import { SettingsStackParamList } from '../../../core/navigation/navigationTypes';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { styles } from './SettingsScreen.styles';
import { strings } from '../../../core/constants/strings';
import { UserPreferencesStore, SUPPORTED_COUNTRIES, DEFAULT_COUNTRY } from '../../../data/utils/UserPreferencesStore';

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

    const [preferredCountry, setPreferredCountry] = useState(DEFAULT_COUNTRY);

    useEffect(() => {
        if (userId && !authVm.isGuest) vm.loadProfile(userId);
    }, [userId, vm, authVm.isGuest]);

    useEffect(() => {
        UserPreferencesStore.getCountry().then(setPreferredCountry);
    }, []);

    const handleNavigateProfile = useCallback(() => {
        navigation.navigate('Profile');
    }, [navigation]);

    const handleNavigatePlatformLink = useCallback(() => {
        navigation.navigate('PlatformLink');
    }, [navigation]);

    const handleNavigateNotifications = useCallback(() => {
        navigation.navigate('NotificationSettings');
    }, [navigation]);

    const handleNotImplemented = useCallback((label: string) => {
        Alert.alert(label, strings.comingSoon);
    }, []);

    const handleCurrencySelect = useCallback(() => {
        const options = SUPPORTED_COUNTRIES.map(c => ({
            text: `${c.label} (${c.currency})`,
            onPress: async () => {
                await UserPreferencesStore.setCountry(c.code);
                setPreferredCountry(c.code);
            },
        }));
        Alert.alert(
            strings.preferredCurrency,
            UserPreferencesStore.getCountryOption(preferredCountry).label,
            [...options, { text: strings.cancel, style: 'cancel' as const }],
        );
    }, [preferredCountry]);

    const handleLogout = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (authVm.isGuest) {
            Alert.alert(
                strings.deleteGuestDataTitle,
                strings.deleteGuestDataMessage,
                [
                    { text: strings.cancel, style: 'cancel' },
                    { text: strings.deleteAll, style: 'destructive', onPress: () => authVm.logout() },
                ],
            );
        } else {
            Alert.alert(strings.logoutConfirmTitle, strings.logoutConfirmMessage, [
                { text: strings.cancel, style: 'cancel' },
                { text: strings.exit, style: 'destructive', onPress: () => authVm.logout() },
            ]);
        }
    }, [authVm]);

    if (vm.isLoading && !vm.profile && !authVm.isGuest) return <ListSkeleton count={4} />;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <Text style={styles.largeTitle}>{strings.settingsTitle}</Text>
            </View>

            {/* Profile Section */}
            {authVm.isGuest ? (
                <View style={styles.profileCard}>
                    <View style={[styles.avatar, { backgroundColor: colors.surfaceElevated }]}>
                        <Feather name="user" size={24} color={colors.textTertiary} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{strings.guest}</Text>
                        <Text style={styles.profileEmail}>{strings.noAccount}</Text>
                    </View>
                </View>
            ) : vm.profile ? (
                <TouchableOpacity
                    style={styles.profileCard}
                    onPress={handleNavigateProfile}
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
            ) : null}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{strings.sectionAccountPlatforms}</Text>
                <View style={styles.group}>
                    <SettingRow
                        label={strings.linkedPlatforms}
                        icon="monitor"
                        onPress={handleNavigatePlatformLink}
                        color={colors.primary}
                        isLast={authVm.isGuest}
                    />
                    {!authVm.isGuest && (
                        <SettingRow
                            label={strings.notifications}
                            icon="bell"
                            onPress={handleNavigateNotifications}
                            color={colors.iosRed}
                            isLast
                        />
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{strings.sectionSupport}</Text>
                <View style={styles.group}>
                    <SettingRow
                        label={`${strings.preferredCurrency} · ${UserPreferencesStore.getCountryOption(preferredCountry).currency}`}
                        icon="dollar-sign"
                        onPress={handleCurrencySelect}
                        color={colors.iosGreen}
                    />
                    <SettingRow
                        label={strings.helpCenter}
                        icon="help-circle"
                        onPress={() => handleNotImplemented(strings.helpCenter)}
                        color={colors.iosPurple}
                    />
                    <SettingRow
                        label={strings.privacy}
                        icon="lock"
                        onPress={() => handleNotImplemented(strings.privacy)}
                        color={colors.iosPurple}
                        isLast
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>
                    {authVm.isGuest ? strings.logoutGuest : strings.logoutRegistered}
                </Text>
            </TouchableOpacity>

            <Text style={styles.version}>{`GameShelf v${Constants.expoConfig?.version ?? '1.0.0'} (OLED Edition)`}</Text>
        </ScrollView>
    );
});
SettingsScreen.displayName = 'SettingsScreen';
