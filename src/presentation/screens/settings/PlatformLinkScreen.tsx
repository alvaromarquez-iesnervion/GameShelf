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
import { PsnLinkModal } from './PsnLinkModal';
import { styles } from './PlatformLinkScreen.styles';
import { Screen } from '../../components/common/Screen';

export const PlatformLinkScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<PlatformLinkViewModel>(TYPES.PlatformLinkViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    const [steamModalVisible, setSteamModalVisible] = useState(false);
    const [epicModalVisible, setEpicModalVisible] = useState(false);
    const [gogModalVisible, setGogModalVisible] = useState(false);
    const [psnModalVisible, setPsnModalVisible] = useState(false);

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
        vm.generateSteamLoginUrl('https://gameshelf.app/auth/steam/callback');
        setSteamModalVisible(true);
    }, [vm]);

    const handleCloseSteamModal = useCallback(() => {
        setSteamModalVisible(false);
        vm.clearError();
    }, [vm]);

    const handleConfirmSteamManual = useCallback(async (input: string) => {
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

    const handleConfirmSteamOpenId = useCallback(async (
        callbackUrl: string,
        params: Record<string, string>,
    ) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await vm.linkSteam(userId, callbackUrl, params);
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

    const handleOpenEpicInBrowser = useCallback(() => {
        const url = vm.getEpicLoginUrl();
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

    // ─── Handlers PSN ─────────────────────────────────────────────────────────

    const handleOpenPsnModal = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        setPsnModalVisible(true);
    }, [vm]);

    const handleClosePsnModal = useCallback(() => {
        setPsnModalVisible(false);
        vm.clearError();
    }, [vm]);

    const handlePsnLink = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await vm.linkPsn(userId);
        if (success) {
            setPsnModalVisible(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'PlayStation vinculado',
                'Tu biblioteca de PlayStation se está sincronizando en segundo plano.\n\nVe a Biblioteca y pulsa ↻ para ver tus juegos.',
                [{ text: 'Entendido' }],
            );
        }
    }, [vm, userId]);

    // ─── Handler desvinculación ───────────────────────────────────────────────

    const handleUnlink = useCallback((platform: PlatformEnum) => {
        const name =
            platform === PlatformEnum.STEAM ? 'Steam' :
            platform === PlatformEnum.GOG ? 'GOG' :
            platform === PlatformEnum.PSN ? 'PlayStation' :
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

    if (vm.isLinking && vm.linkedPlatforms.length === 0) return <ListSkeleton count={4} />;
    if (vm.errorMessage && !steamModalVisible && !epicModalVisible && !gogModalVisible && !psnModalVisible) {
        return <ErrorMessage message={vm.errorMessage} onRetry={handleRetry} />;
    }

    const steamLinked = vm.isPlatformLinked(PlatformEnum.STEAM);
    const epicLinked = vm.isPlatformLinked(PlatformEnum.EPIC_GAMES);
    const gogLinked = vm.isPlatformLinked(PlatformEnum.GOG);
    const psnLinked = vm.isPlatformLinked(PlatformEnum.PSN);

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Screen style={styles.container} topInset="header">
            <Text style={styles.sectionLabel}>PC</Text>

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

            <Text style={styles.sectionLabel}>CONSOLA</Text>

            <View style={styles.group}>
                <PlatformRow
                    platform={PlatformEnum.PSN}
                    linked={psnLinked}
                    loading={vm.isLinking}
                    onLink={handleOpenPsnModal}
                    onUnlink={() => handleUnlink(PlatformEnum.PSN)}
                />
            </View>

            <Text style={styles.footnote}>
                Steam requiere que tu perfil y la sección &quot;Estado del juego&quot; sean públicos para sincronizar tu biblioteca.{'\n'}
                PlayStation solo muestra juegos que hayas iniciado al menos una vez.
            </Text>

            <SteamLinkModal
                visible={steamModalVisible}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                loginUrl={vm.steamLoginUrl ?? ''}
                onConfirmManual={handleConfirmSteamManual}
                onConfirmOpenId={handleConfirmSteamOpenId}
                onClose={handleCloseSteamModal}
            />

            <EpicLinkModal
                visible={epicModalVisible}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                loginUrl={vm.getEpicLoginUrl()}
                onConfirmAuthCode={handleConfirmEpicAuthCode}
                onConfirmGdpr={handleConfirmEpicGdpr}
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

            <PsnLinkModal
                visible={psnModalVisible}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                onLink={handlePsnLink}
                onClose={handleClosePsnModal}
            />
        </Screen>
    );
});
PlatformLinkScreen.displayName = 'PlatformLinkScreen';
