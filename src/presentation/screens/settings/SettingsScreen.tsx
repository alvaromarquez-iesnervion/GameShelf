import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SettingsViewModel } from '../../viewmodels/SettingsViewModel';
import { ICountryPreferenceService, SUPPORTED_COUNTRIES, DEFAULT_COUNTRY } from '../../../domain/interfaces/usecases/settings/ICountryPreferenceService';
import { TYPES } from '../../../di/types';
import { SettingsStackParamList } from '../../../core/navigation/navigationTypes';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { styles } from './SettingsScreen.styles';
import { strings } from '../../../core/constants/strings';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { CurrencyDropdown } from '../../components/common/CurrencyDropdown';

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
    const insets = useSafeAreaInsets();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<SettingsViewModel>(TYPES.SettingsViewModel);
    const countryPrefs = useInjection<ICountryPreferenceService>(TYPES.ICountryPreferenceService);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';

    const [preferredCountry, setPreferredCountry] = useState(DEFAULT_COUNTRY);
    const [currencyDropdownVisible, setCurrencyDropdownVisible] = useState(false);
    const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

    useEffect(() => {
        if (userId && !authVm.isGuest) vm.loadProfile(userId);
    }, [userId, vm, authVm.isGuest]);

    useEffect(() => {
        countryPrefs.loadSavedPreference().then(() => {
            setPreferredCountry(countryPrefs.effectiveCountry);
        });
    }, [countryPrefs]);

    const handleNavigateProfile = useCallback(() => {
        navigation.navigate('Profile');
    }, [navigation]);

    const handleNavigatePrivacy = useCallback(() => {
        navigation.navigate('Privacy');
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
        setCurrencyDropdownVisible(true);
    }, []);

    const handleCurrencyChange = useCallback(async (code: string) => {
        await countryPrefs.setCountryAndSync(code);
        setPreferredCountry(code);
        setCurrencyDropdownVisible(false);
    }, [countryPrefs]);

    const handleLogout = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setLogoutConfirmVisible(true);
    }, []);

    const handleLogoutConfirm = useCallback(() => {
        authVm.logout();
        setLogoutConfirmVisible(false);
    }, [authVm]);

    if (vm.isLoading && !vm.profile && !authVm.isGuest) return <ListSkeleton count={4} />;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
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
                        label={`${strings.preferredCurrency} · ${countryPrefs.getCountryOption(preferredCountry).currency}`}
                        icon="dollar-sign"
                        onPress={handleCurrencySelect}
                        color={colors.iosGreen}
                    />
                    {currencyDropdownVisible && (
                        <CurrencyDropdown
                            visible
                            options={SUPPORTED_COUNTRIES.map(c => ({ label: `${c.label} (${c.currency})`, value: c.code }))}
                            selectedValue={preferredCountry}
                            onSelect={handleCurrencyChange}
                            onClose={() => setCurrencyDropdownVisible(false)}
                        />
                    )}
                    <SettingRow
                        label={strings.helpCenter}
                        icon="help-circle"
                        onPress={() => handleNotImplemented(strings.helpCenter)}
                        color={colors.iosPurple}
                    />
                    <SettingRow
                        label={strings.privacy}
                        icon="lock"
                        onPress={handleNavigatePrivacy}
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

            <ConfirmDialog
                visible={logoutConfirmVisible}
                title={authVm.isGuest ? strings.deleteGuestDataTitle : strings.logoutConfirmTitle}
                message={authVm.isGuest ? strings.deleteGuestDataMessage : strings.logoutConfirmMessage}
                confirmText={authVm.isGuest ? strings.deleteAll : strings.exit}
                destructive
                onConfirm={handleLogoutConfirm}
                onCancel={() => setLogoutConfirmVisible(false)}
            />

            <Text style={styles.version}>{`GameShelf v${Constants.expoConfig?.version ?? '1.0.0'} (OLED Edition)`}</Text>
        </ScrollView>
    );
});
SettingsScreen.displayName = 'SettingsScreen';
