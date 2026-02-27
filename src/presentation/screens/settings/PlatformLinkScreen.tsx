import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
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
import { styles } from './PlatformLinkScreen.styles';

export const PlatformLinkScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<PlatformLinkViewModel>(TYPES.PlatformLinkViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    const [steamModalVisible, setSteamModalVisible] = useState(false);
    const [epicModalVisible, setEpicModalVisible] = useState(false);

    useEffect(() => {
        if (userId) vm.loadLinkedPlatforms(userId);
    }, [userId]);

    if (vm.isLinking && vm.linkedPlatforms.length === 0) return <ListSkeleton count={2} />;
    if (vm.errorMessage && !steamModalVisible && !epicModalVisible) {
        return <ErrorMessage message={vm.errorMessage} onRetry={() => vm.loadLinkedPlatforms(userId)} />;
    }

    const steamLinked = vm.isPlatformLinked(PlatformEnum.STEAM);
    const epicLinked = vm.isPlatformLinked(PlatformEnum.EPIC_GAMES);

    // ─── Handlers Steam ───────────────────────────────────────────────────────

    const handleOpenSteamModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        setSteamModalVisible(true);
    };

    const handleCloseSteamModal = () => {
        setSteamModalVisible(false);
        vm.clearError();
    };

    const handleConfirmSteam = async (input: string) => {
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
    };

    // ─── Handlers Epic ────────────────────────────────────────────────────────

    const handleOpenEpicModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        setEpicModalVisible(true);
    };

    const handleCloseEpicModal = () => {
        setEpicModalVisible(false);
        vm.clearError();
    };

    const handleOpenEpicLoginInBrowser = () => {
        const { Linking } = require('react-native');
        const url = 'https://www.epicgames.com/login';
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'No se pudo abrir el navegador. Visita manualmente:\n\n' + url);
        });
    };

    const handleOpenEpicInBrowser = () => {
        const { Linking } = require('react-native');
        const url = vm.getEpicAuthUrl();
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'No se pudo abrir el navegador. Copia esta URL manualmente:\n\n' + url);
        });
    };

    const handleConfirmEpicAuthCode = async (code: string) => {
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
    };

    const handleConfirmEpicGdpr = async (json: string) => {
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
    };

    // ─── Handler desvinculación ───────────────────────────────────────────────

    const handleUnlink = (platform: PlatformEnum) => {
        const name = platform === PlatformEnum.STEAM ? 'Steam' : 'Epic Games';
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            `Desvincular ${name}`,
            `¿Seguro que deseas desvincular tu cuenta de ${name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Desvincular', style: 'destructive', onPress: () => vm.unlinkPlatform(userId, platform) },
            ],
        );
    };

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
            </View>

            <Text style={styles.footnote}>
                Steam requiere que tu perfil y la sección "Estado del juego" sean públicos para sincronizar tu biblioteca.
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
        </View>
    );
});
