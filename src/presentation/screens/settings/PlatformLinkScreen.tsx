import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Alert, Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { PlatformLinkViewModel } from '../../viewmodels/PlatformLinkViewModel';
import { TYPES } from '../../../di/types';
import { Platform as PlatformEnum } from '../../../domain/enums/Platform';
import { PlatformRow } from '../../components/platforms/PlatformRow';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { SteamLinkModal } from './SteamLinkModal';
import { EpicLinkModal } from './EpicLinkModal';
import { GogLinkModal } from './GogLinkModal';
import { styles } from './PlatformLinkScreen.styles';

export const PlatformLinkScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<PlatformLinkViewModel>(TYPES.PlatformLinkViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    const [steamModalVisible, setSteamModalVisible] = useState(false);
    const [epicModalVisible, setEpicModalVisible] = useState(false);
    const [gogModalVisible, setGogModalVisible] = useState(false);

    useEffect(() => {
        if (userId) vm.loadLinkedPlatforms(userId);
    }, [userId, vm]);

    const handleRetry = useCallback(() => {
        vm.loadLinkedPlatforms(userId);
    }, [vm, userId]);

    // ─── Handlers Steam ───────────────────────────────────────────────────────

    const handleOpenSteamModal = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        setSteamModalVisible(true);
    }, [vm]);

    const handleCloseSteamModal = useCallback(() => {
        setSteamModalVisible(false);
        vm.clearError();
    }, [vm]);

    const handleConfirmSteam = useCallback(async (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await vm.linkSteamById(userId, trimmed);
        if (success) {
            setSteamModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Steam vinculado',
                'Tu biblioteca de Steam se está sincronizando en segundo plano.\n\nVe a Biblioteca y pulsa ↻ para ver tus juegos.',
                [{ text: 'Entendido' }],
            );
        }
    }, [vm, userId]);

    // ─── Handlers Epic ────────────────────────────────────────────────────────

    const handleOpenEpicModal = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        setEpicModalVisible(true);
    }, [vm]);

    const handleCloseEpicModal = useCallback(() => {
        setEpicModalVisible(false);
        vm.clearError();
    }, [vm]);

    const handleOpenEpicLoginInBrowser = useCallback(() => {
        const url = 'https://www.epicgames.com/login';
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'No se pudo abrir el navegador. Visita manualmente:\n\n' + url);
        });
    }, []);

    const handleOpenEpicInBrowser = useCallback(() => {
        const url = vm.getEpicAuthUrl();
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'No se pudo abrir el navegador. Copia esta URL manualmente:\n\n' + url);
        });
    }, [vm]);

    const handleConfirmEpicAuthCode = useCallback(async (code: string) => {
        const trimmed = code.trim();
        if (!trimmed) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await vm.linkEpicByAuthCode(userId, trimmed);
        if (success) {
            setEpicModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Epic Games vinculado',
                'Tu biblioteca de Epic se está sincronizando en segundo plano.\n\nVe a Biblioteca y pulsa ↻ para ver tus juegos.',
                [{ text: 'Entendido' }],
            );
        }
    }, [vm, userId]);

    const handleConfirmEpicGdpr = useCallback(async (json: string) => {
        const trimmed = json.trim();
        if (!trimmed) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await vm.linkEpic(userId, trimmed);
        if (success) {
            setEpicModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Epic Games vinculado',
                'Tu biblioteca de Epic se está sincronizando en segundo plano.\n\nVe a Biblioteca y pulsa ↻ para ver tus juegos.',
                [{ text: 'Entendido' }],
            );
        }
    }, [vm, userId]);

    // ─── Handlers GOG ─────────────────────────────────────────────────────────

    const handleOpenGogModal = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        setGogModalVisible(true);
    }, [vm]);

    const handleCloseGogModal = useCallback(() => {
        setGogModalVisible(false);
        vm.clearError();
    }, [vm]);

    const handleGogCodeReceived = useCallback(async (code: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await vm.linkGogByCode(userId, code);
        if (success) {
            setGogModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'GOG vinculado',
                'Tu biblioteca de GOG se está sincronizando en segundo plano.\n\nVe a Biblioteca y pulsa ↻ para ver tus juegos.',
                [{ text: 'Entendido' }],
            );
        }
    }, [vm, userId]);

    // ─── Handler desvinculación ───────────────────────────────────────────────

    const handleUnlink = useCallback((platform: PlatformEnum) => {
        const name =
            platform === PlatformEnum.STEAM ? 'Steam' :
            platform === PlatformEnum.GOG ? 'GOG' :
            'Epic Games';
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            `Desvincular ${name}`,
            `¿Seguro que deseas desvincular tu cuenta de ${name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Desvincular', style: 'destructive', onPress: () => vm.unlinkPlatform(userId, platform) },
            ],
        );
    }, [vm, userId]);

    // ─── Early returns (después de todos los hooks) ───────────────────────────

    if (vm.isLinking && vm.linkedPlatforms.length === 0) return <ListSkeleton count={3} />;
    if (vm.errorMessage && !steamModalVisible && !epicModalVisible && !gogModalVisible) {
        return <ErrorMessage message={vm.errorMessage} onRetry={handleRetry} />;
    }

    const steamLinked = vm.isPlatformLinked(PlatformEnum.STEAM);
    const epicLinked = vm.isPlatformLinked(PlatformEnum.EPIC_GAMES);
    const gogLinked = vm.isPlatformLinked(PlatformEnum.GOG);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <Text style={styles.sectionLabel}>CUENTAS VINCULADAS</Text>

            <View style={styles.group}>
                <PlatformRow
                    platform={PlatformEnum.STEAM}
                    linked={steamLinked}
                    loading={vm.isLinking}
                    onLink={handleOpenSteamModal}
                    onUnlink={() => handleUnlink(PlatformEnum.STEAM)}
                />
                <View style={styles.separator} />
                <PlatformRow
                    platform={PlatformEnum.EPIC_GAMES}
                    linked={epicLinked}
                    loading={vm.isLinking}
                    onLink={handleOpenEpicModal}
                    onUnlink={() => handleUnlink(PlatformEnum.EPIC_GAMES)}
                />
                <View style={styles.separator} />
                <PlatformRow
                    platform={PlatformEnum.GOG}
                    linked={gogLinked}
                    loading={vm.isLinking}
                    onLink={handleOpenGogModal}
                    onUnlink={() => handleUnlink(PlatformEnum.GOG)}
                />
            </View>

            <Text style={styles.footnote}>
                Steam requiere que tu perfil y la sección &quot;Estado del juego&quot; sean públicos para sincronizar tu biblioteca.
            </Text>

            <SteamLinkModal
                visible={steamModalVisible}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                onConfirm={handleConfirmSteam}
                onClose={handleCloseSteamModal}
            />

            <EpicLinkModal
                visible={epicModalVisible}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                onConfirmAuthCode={handleConfirmEpicAuthCode}
                onConfirmGdpr={handleConfirmEpicGdpr}
                onOpenLogin={handleOpenEpicLoginInBrowser}
                onOpenBrowser={handleOpenEpicInBrowser}
                onClose={handleCloseEpicModal}
            />

            <GogLinkModal
                visible={gogModalVisible}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                authUrl={vm.getGogAuthUrl()}
                onCodeReceived={handleGogCodeReceived}
                onClose={handleCloseGogModal}
            />
        </View>
    );
});
