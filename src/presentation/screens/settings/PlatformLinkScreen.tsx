import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import * as Haptics from 'expo-haptics';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { PlatformLinkViewModel } from '../../viewmodels/PlatformLinkViewModel';
import { Platform as PlatformEnum } from '../../../domain/enums/Platform';
import { PlatformRow } from '../../components/platforms/PlatformRow';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { Screen } from '../../components/common/Screen';
import { SteamLinkModal } from './SteamLinkModal';
import { EpicLinkModal } from './EpicLinkModal';
import { GogLinkModal } from './GogLinkModal';
import { PsnLinkModal } from './PsnLinkModal';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const PlatformLinkScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<PlatformLinkViewModel>(TYPES.PlatformLinkViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    const [steamModal, setSteamModal] = useState(false);
    const [epicModal, setEpicModal] = useState(false);
    const [gogModal, setGogModal] = useState(false);
    const [psnModal, setPsnModal] = useState(false);

    useEffect(() => {
        if (userId) vm.loadLinkedPlatforms(userId);
    }, [userId, vm]);

    const handleRetry = useCallback(() => { vm.loadLinkedPlatforms(userId); }, [vm, userId]);

    const successAlert = (label: string) => Alert.alert(
        `${label} vinculado`,
        `Tu biblioteca de ${label} se está sincronizando en segundo plano.\n\nVe a Biblioteca y pulsa ↻ para ver tus juegos.`,
        [{ text: 'Entendido' }],
    );

    const openModal = (set: (b: boolean) => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        set(true);
    };
    const closeModal = (set: (b: boolean) => void) => {
        set(false);
        vm.clearError();
    };

    const openSteam = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        vm.generateSteamLoginUrl('https://gameshelf.app/auth/steam/callback');
        setSteamModal(true);
    }, [vm]);

    const onSteamManual = useCallback(async (input: string) => {
        const t = input.trim();
        if (!t) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (await vm.linkSteamById(userId, t)) {
            setSteamModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            successAlert('Steam');
        }
    }, [vm, userId]);

    const onSteamOpenId = useCallback(async (callbackUrl: string, params: Record<string, string>) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (await vm.linkSteam(userId, callbackUrl, params)) {
            setSteamModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            successAlert('Steam');
        }
    }, [vm, userId]);

    const onEpicAuthCode = useCallback(async (code: string) => {
        const t = code.trim();
        if (!t) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (await vm.linkEpicByAuthCode(userId, t)) {
            setEpicModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            successAlert('Epic Games');
        }
    }, [vm, userId]);

    const onEpicGdpr = useCallback(async (json: string) => {
        const t = json.trim();
        if (!t) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (await vm.linkEpic(userId, t)) {
            setEpicModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            successAlert('Epic Games');
        }
    }, [vm, userId]);

    const onEpicBrowser = useCallback(() => {
        const url = vm.getEpicLoginUrl();
        Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el navegador. URL:\n\n' + url));
    }, [vm]);

    const onGogCode = useCallback(async (code: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (await vm.linkGogByCode(userId, code)) {
            setGogModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            successAlert('GOG');
        }
    }, [vm, userId]);

    const onPsnLink = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (await vm.linkPsn(userId)) {
            setPsnModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            successAlert('PlayStation');
        }
    }, [vm, userId]);

    const onUnlink = useCallback((platform: PlatformEnum) => {
        const name = platform === PlatformEnum.STEAM ? 'Steam'
            : platform === PlatformEnum.GOG ? 'GOG'
            : platform === PlatformEnum.PSN ? 'PlayStation'
            : 'Epic Games';
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

    if (vm.isLinking && vm.linkedPlatforms.length === 0) return <ListSkeleton count={4} />;
    if (vm.errorMessage && !steamModal && !epicModal && !gogModal && !psnModal) {
        return <ErrorMessage message={vm.errorMessage} onRetry={handleRetry} />;
    }

    const linked = (p: PlatformEnum) => vm.isPlatformLinked(p);

    return (
        <Screen topInset="header">
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.label}>PC</Text>
                <View style={styles.group}>
                    <PlatformRow
                        platform={PlatformEnum.STEAM}
                        linked={linked(PlatformEnum.STEAM)}
                        loading={vm.isLinking}
                        onLink={openSteam}
                        onUnlink={() => onUnlink(PlatformEnum.STEAM)}
                    />
                    <View style={styles.sep} />
                    <PlatformRow
                        platform={PlatformEnum.EPIC_GAMES}
                        linked={linked(PlatformEnum.EPIC_GAMES)}
                        loading={vm.isLinking}
                        onLink={() => openModal(setEpicModal)}
                        onUnlink={() => onUnlink(PlatformEnum.EPIC_GAMES)}
                    />
                    <View style={styles.sep} />
                    <PlatformRow
                        platform={PlatformEnum.GOG}
                        linked={linked(PlatformEnum.GOG)}
                        loading={vm.isLinking}
                        onLink={() => openModal(setGogModal)}
                        onUnlink={() => onUnlink(PlatformEnum.GOG)}
                    />
                </View>

                <Text style={styles.label}>Consola</Text>
                <View style={styles.group}>
                    <PlatformRow
                        platform={PlatformEnum.PSN}
                        linked={linked(PlatformEnum.PSN)}
                        loading={vm.isLinking}
                        onLink={() => openModal(setPsnModal)}
                        onUnlink={() => onUnlink(PlatformEnum.PSN)}
                    />
                </View>

                <Text style={styles.footnote}>
                    Steam requiere perfil público y la sección &quot;Estado del juego&quot; visible.{'\n'}
                    PlayStation solo muestra juegos que hayas iniciado al menos una vez.
                </Text>
            </ScrollView>

            <SteamLinkModal
                visible={steamModal}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                loginUrl={vm.steamLoginUrl ?? ''}
                onConfirmManual={onSteamManual}
                onConfirmOpenId={onSteamOpenId}
                onClose={() => closeModal(setSteamModal)}
            />
            <EpicLinkModal
                visible={epicModal}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                loginUrl={vm.getEpicLoginUrl()}
                onConfirmAuthCode={onEpicAuthCode}
                onConfirmGdpr={onEpicGdpr}
                onOpenBrowser={onEpicBrowser}
                onClose={() => closeModal(setEpicModal)}
            />
            <GogLinkModal
                visible={gogModal}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                authUrl={vm.getGogAuthUrl()}
                onCodeReceived={onGogCode}
                onClose={() => closeModal(setGogModal)}
            />
            <PsnLinkModal
                visible={psnModal}
                isLinking={vm.isLinking}
                errorMessage={vm.errorMessage}
                onLink={onPsnLink}
                onClose={() => closeModal(setPsnModal)}
            />
        </Screen>
    );
});

const styles = StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md },
    label: { ...typography.label, marginTop: spacing.sm, marginLeft: spacing.xs },
    group: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1, borderColor: colors.borderSubtle,
        overflow: 'hidden',
    },
    sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider, marginLeft: spacing.xl + spacing.md },
    footnote: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.md, textAlign: 'center' },
});
