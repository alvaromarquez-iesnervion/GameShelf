import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    TextInput,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Linking,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { PlatformLinkViewModel } from '../../viewmodels/PlatformLinkViewModel';
import { TYPES } from '../../../di/types';
import { Platform as PlatformEnum } from '../../../domain/enums/Platform';
import { PlatformBadge } from '../../components/platforms/PlatformBadge';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

// ─── Screen ───────────────────────────────────────────────────────────────────

export const PlatformLinkScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<PlatformLinkViewModel>(TYPES.PlatformLinkViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    const [steamModalVisible, setSteamModalVisible] = useState(false);
    const [steamInput, setSteamInput] = useState('');
    const [epicModalVisible, setEpicModalVisible] = useState(false);
    // 'authcode' = flujo nuevo (auth code); 'gdpr' = fallback importación manual
    const [epicMode, setEpicMode] = useState<'authcode' | 'gdpr'>('authcode');
    const [epicInput, setEpicInput] = useState('');

    useEffect(() => {
        if (userId) vm.loadLinkedPlatforms(userId);
    }, [userId]);

    if (vm.isLinking && vm.linkedPlatforms.length === 0) return <ListSkeleton count={2} />;
    if (vm.errorMessage && !steamModalVisible) {
        return <ErrorMessage message={vm.errorMessage} onRetry={() => vm.loadLinkedPlatforms(userId)} />;
    }

    const steamLinked = vm.isPlatformLinked(PlatformEnum.STEAM);
    const epicLinked = vm.isPlatformLinked(PlatformEnum.EPIC_GAMES);

    // ─── Steam — vinculación por SteamID / URL de perfil ────────────────────
    const handleOpenSteamModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        setSteamInput('');
        setSteamModalVisible(true);
    };

    const handleConfirmSteam = async () => {
        const trimmed = steamInput.trim();
        if (!trimmed) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await vm.linkSteamById(userId, trimmed);

        if (success) {
            setSteamModalVisible(false);
            setSteamInput('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Steam vinculado',
                'Tu biblioteca de Steam se está sincronizando en segundo plano.\n\nVe a Biblioteca y pulsa ↻ para ver tus juegos.',
                [{ text: 'Entendido' }],
            );
        }
    };

    // ─── Epic — vinculación (auth code preferido, GDPR como fallback) ─────────
    const handleOpenEpicModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        vm.clearError();
        setEpicInput('');
        setEpicMode('authcode');
        setEpicModalVisible(true);
    };

    const handleOpenEpicInBrowser = () => {
        const url = vm.getEpicAuthUrl();
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'No se pudo abrir el navegador. Copia esta URL manualmente:\n\n' + url);
        });
    };

    const handleConfirmEpic = async () => {
        const trimmed = epicInput.trim();
        if (!trimmed) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        let success: boolean;
        if (epicMode === 'authcode') {
            success = await vm.linkEpicByAuthCode(userId, trimmed);
        } else {
            success = await vm.linkEpic(userId, trimmed);
        }

        if (success) {
            setEpicModalVisible(false);
            setEpicInput('');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                'Epic Games vinculado',
                'Tu biblioteca de Epic se está sincronizando en segundo plano.\n\nVe a Biblioteca y pulsa ↻ para ver tus juegos.',
                [{ text: 'Entendido' }],
            );
        }
    };

    const handleSwitchEpicMode = (mode: 'authcode' | 'gdpr') => {
        vm.clearError();
        setEpicInput('');
        setEpicMode(mode);
    };

    const handleUnlink = (platform: PlatformEnum) => {
        const name = platform === PlatformEnum.STEAM ? 'Steam' : 'Epic Games';
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        Alert.alert(
            `Desvincular ${name}`,
            `¿Seguro que deseas desvincular tu cuenta de ${name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desvincular',
                    style: 'destructive',
                    onPress: () => vm.unlinkPlatform(userId, platform),
                },
            ],
        );
    };

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

            {/* ─── Modal de vinculación Steam ────────────────────────────────────── */}
            <Modal
                visible={steamModalVisible}
                animationType="slide"
                presentationStyle="formSheet"
                onRequestClose={() => setSteamModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Header del modal */}
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Vincular Steam</Text>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => { setSteamModalVisible(false); vm.clearError(); }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Feather name="x" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                        <Text style={styles.modalInstruction}>
                            Introduce tu SteamID, URL de perfil o nombre de usuario de Steam:
                        </Text>

                        {/* Ejemplos de formato */}
                        <View style={styles.examplesBox}>
                            <Example icon="hash" text="76561197960287930" label="SteamID" />
                            <Example icon="link" text="steamcommunity.com/id/tunombre" label="Perfil por nombre" />
                            <Example icon="link" text="steamcommunity.com/profiles/76561..." label="Perfil numérico" />
                        </View>

                        {/* Input */}
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Introduce tu SteamID o URL..."
                            placeholderTextColor={colors.textDisabled}
                            value={steamInput}
                            onChangeText={setSteamInput}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardAppearance="dark"
                            returnKeyType="done"
                            onSubmitEditing={handleConfirmSteam}
                        />

                        {/* Error */}
                        {vm.errorMessage ? (
                            <View style={styles.modalError}>
                                <Feather name="alert-circle" size={14} color={colors.error} />
                                <Text style={styles.modalErrorText}>{vm.errorMessage}</Text>
                            </View>
                        ) : null}

                        {/* Botón confirmar */}
                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                (!steamInput.trim() || vm.isLinking) && styles.confirmBtnDisabled,
                            ]}
                            onPress={handleConfirmSteam}
                            disabled={!steamInput.trim() || vm.isLinking}
                            activeOpacity={0.8}
                        >
                            {vm.isLinking ? (
                                <ActivityIndicator size="small" color={colors.onPrimary} />
                            ) : (
                                <>
                                    <Feather name="link" size={16} color={colors.onPrimary} />
                                    <Text style={styles.confirmBtnText}>Vincular Steam</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.modalFootnote}>
                            Tu contraseña nunca se comparte con GameShelf.{'\n'}
                            Solo usamos tu SteamID para leer tu biblioteca pública.
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ─── Modal de vinculación Epic ──────────────────────────────────── */}
            <Modal
                visible={epicModalVisible}
                animationType="slide"
                presentationStyle="formSheet"
                onRequestClose={() => { setEpicModalVisible(false); vm.clearError(); }}
            >
                <KeyboardAvoidingView
                    style={styles.modalContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Vincular Epic Games</Text>
                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => { setEpicModalVisible(false); vm.clearError(); }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Feather name="x" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Selector de modo */}
                    <View style={styles.modeSelector}>
                        <TouchableOpacity
                            style={[styles.modeTab, epicMode === 'authcode' && styles.modeTabActive]}
                            onPress={() => handleSwitchEpicMode('authcode')}
                            activeOpacity={0.75}
                        >
                            <Feather
                                name="zap"
                                size={13}
                                color={epicMode === 'authcode' ? colors.primary : colors.textTertiary}
                            />
                            <Text style={[styles.modeTabText, epicMode === 'authcode' && styles.modeTabTextActive]}>
                                Inicio de sesión
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeTab, epicMode === 'gdpr' && styles.modeTabActive]}
                            onPress={() => handleSwitchEpicMode('gdpr')}
                            activeOpacity={0.75}
                        >
                            <Feather
                                name="file-text"
                                size={13}
                                color={epicMode === 'gdpr' ? colors.primary : colors.textTertiary}
                            />
                            <Text style={[styles.modeTabText, epicMode === 'gdpr' && styles.modeTabTextActive]}>
                                Importar JSON
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.modalBody}
                        contentContainerStyle={styles.modalBodyContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {epicMode === 'authcode' ? (
                            /* ── Flujo auth code (preferido) ── */
                            <>
                                <Text style={styles.modalInstruction}>
                                    Inicia sesión en Epic y copia el código que aparece:
                                </Text>

                                <View style={styles.stepsBox}>
                                    <Step
                                        number={1}
                                        text="Pulsa el botón de abajo para abrir Epic Games en el navegador e inicia sesión con tu cuenta"
                                    />
                                    <Step
                                        number={2}
                                        text='Copia el código que aparece en pantalla (campo "code") y pégalo aquí'
                                    />
                                </View>

                                {/* Botón abrir navegador */}
                                <TouchableOpacity
                                    style={styles.openBrowserBtn}
                                    onPress={handleOpenEpicInBrowser}
                                    activeOpacity={0.8}
                                >
                                    <Feather name="external-link" size={15} color={colors.primary} />
                                    <Text style={styles.openBrowserText}>Abrir Epic Games en el navegador</Text>
                                </TouchableOpacity>

                                {/* Input código */}
                                <Text style={styles.modalLabel}>Pega el código aquí:</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Ej: a1b2c3d4e5f6..."
                                    placeholderTextColor={colors.textDisabled}
                                    value={epicInput}
                                    onChangeText={setEpicInput}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardAppearance="dark"
                                    returnKeyType="done"
                                    onSubmitEditing={handleConfirmEpic}
                                />

                                {/* Error */}
                                {vm.errorMessage ? (
                                    <View style={styles.modalError}>
                                        <Feather name="alert-circle" size={14} color={colors.error} />
                                        <Text style={styles.modalErrorText}>{vm.errorMessage}</Text>
                                    </View>
                                ) : null}

                                {/* Botón confirmar */}
                                <TouchableOpacity
                                    style={[
                                        styles.confirmBtn,
                                        (!epicInput.trim() || vm.isLinking) && styles.confirmBtnDisabled,
                                    ]}
                                    onPress={handleConfirmEpic}
                                    disabled={!epicInput.trim() || vm.isLinking}
                                    activeOpacity={0.8}
                                >
                                    {vm.isLinking ? (
                                        <ActivityIndicator size="small" color={colors.onPrimary} />
                                    ) : (
                                        <>
                                            <Feather name="link" size={16} color={colors.onPrimary} />
                                            <Text style={styles.confirmBtnText}>Vincular Epic Games</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.modalFootnote}>
                                    El código caduca en ~5 minutos.{'\n'}
                                    Usa una API interna de Epic — puede cambiar sin previo aviso.
                                </Text>
                            </>
                        ) : (
                            /* ── Flujo GDPR (fallback) ── */
                            <>
                                <Text style={styles.modalInstruction}>
                                    Descarga tu biblioteca de Epic manualmente:
                                </Text>

                                <View style={styles.stepsBox}>
                                    <Step number={1} text="Ve a epicgames.com/account/privacy" />
                                    <Step number={2} text="Haz clic en 'Descargar tus datos personales'" />
                                    <Step number={3} text="Espera 24-48 horas y descarga el ZIP" />
                                    <Step number={4} text="Abre 'entitlementGrantByEntitlementName.json' y cópialo" />
                                </View>

                                <Text style={styles.modalLabel}>Pega el contenido del JSON aquí:</Text>
                                <TextInput
                                    style={styles.epicModalInput}
                                    placeholder="Pega el contenido JSON..."
                                    placeholderTextColor={colors.textDisabled}
                                    value={epicInput}
                                    onChangeText={setEpicInput}
                                    multiline
                                    numberOfLines={8}
                                    textAlignVertical="top"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardAppearance="dark"
                                />

                                {/* Error */}
                                {vm.errorMessage ? (
                                    <View style={styles.modalError}>
                                        <Feather name="alert-circle" size={14} color={colors.error} />
                                        <Text style={styles.modalErrorText}>{vm.errorMessage}</Text>
                                    </View>
                                ) : null}

                                {/* Botón confirmar */}
                                <TouchableOpacity
                                    style={[
                                        styles.confirmBtn,
                                        (!epicInput.trim() || vm.isLinking) && styles.confirmBtnDisabled,
                                    ]}
                                    onPress={handleConfirmEpic}
                                    disabled={!epicInput.trim() || vm.isLinking}
                                    activeOpacity={0.8}
                                >
                                    {vm.isLinking ? (
                                        <ActivityIndicator size="small" color={colors.onPrimary} />
                                    ) : (
                                        <>
                                            <Feather name="link" size={16} color={colors.onPrimary} />
                                            <Text style={styles.confirmBtnText}>Vincular Epic Games</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <Text style={styles.modalFootnote}>
                                    Tu JSON nunca se comparte con servidores externos.{'\n'}
                                    Solo se procesa localmente en tu dispositivo.
                                </Text>
                            </>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
});

// ─── Sub-componentes ──────────────────────────────────────────────────────────

interface PlatformRowProps {
    platform: PlatformEnum;
    linked: boolean;
    loading: boolean;
    onLink: () => void;
    onUnlink: () => void;
}

const PlatformRow: React.FC<PlatformRowProps> = ({ platform, linked, loading, onLink, onUnlink }) => (
    <View style={styles.row}>
        <PlatformBadge platform={platform} />
        <View style={styles.rowMeta}>
            <Text style={linked ? styles.statusLinked : styles.statusUnlinked}>
                {linked ? 'Vinculado' : 'No vinculado'}
            </Text>
        </View>
        <TouchableOpacity
            style={[styles.actionBtn, linked ? styles.unlinkBtn : styles.linkBtn]}
            onPress={linked ? onUnlink : onLink}
            disabled={loading}
            activeOpacity={0.75}
        >
            <Feather
                name={linked ? 'link-2' : 'link'}
                size={14}
                color={linked ? colors.error : colors.onPrimary}
            />
            <Text style={[styles.actionText, linked && styles.unlinkText]}>
                {linked ? 'Desvincular' : 'Vincular'}
            </Text>
        </TouchableOpacity>
    </View>
);

interface ExampleProps {
    icon: keyof typeof Feather.glyphMap;
    text: string;
    label: string;
}

const Example: React.FC<ExampleProps> = ({ icon, text, label }) => (
    <View style={styles.exampleRow}>
        <Feather name={icon} size={12} color={colors.textTertiary} style={styles.exampleIcon} />
        <View style={styles.exampleContent}>
            <Text style={styles.exampleLabel}>{label}</Text>
            <Text style={styles.exampleText} numberOfLines={1}>{text}</Text>
        </View>
    </View>
);

interface StepProps {
    number: number;
    text: string;
}

const Step: React.FC<StepProps> = ({ number, text }) => (
    <View style={styles.stepRow}>
        <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{number}</Text>
        </View>
        <Text style={styles.stepText}>{text}</Text>
    </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginHorizontal: spacing.md,
    },
    rowMeta: {
        flex: 1,
        marginLeft: spacing.md,
    },
    statusLinked: {
        ...typography.small,
        color: colors.success,
        fontWeight: '600',
    },
    statusUnlinked: {
        ...typography.small,
        color: colors.textTertiary,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: radius.md,
    },
    linkBtn: { backgroundColor: colors.primary },
    unlinkBtn: {
        backgroundColor: colors.errorBackground,
        borderWidth: 1,
        borderColor: colors.errorBorder,
    },
    actionText: {
        color: colors.onPrimary,
        fontWeight: '600',
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    unlinkText: { color: colors.error },
    footnote: {
        ...typography.small,
        color: colors.textTertiary,
        marginTop: spacing.md,
        marginHorizontal: spacing.sm,
        lineHeight: 18,
    },

    // ─── Modal ──────────────────────────────────────────────────────────────
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        position: 'absolute',
        top: 8,
        alignSelf: 'center',
        left: '50%',
        marginLeft: -18,
    },
    modalTitle: {
        ...typography.subheading,
        flex: 1,
        textAlign: 'center',
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    // Alias usado como contentContainerStyle del ScrollView en el modal Epic
    // (modalBodyContent está definido en la sección Epic Modal abajo)
    modalInstruction: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    examplesBox: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    exampleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    exampleIcon: {
        marginRight: spacing.sm,
        width: 16,
    },
    exampleContent: {
        flex: 1,
    },
    exampleLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    exampleText: {
        ...typography.small,
        color: colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    modalInput: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.textPrimary,
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        marginBottom: spacing.md,
    },
    modalError: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.errorBackground,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    modalErrorText: {
        ...typography.small,
        color: colors.error,
        flex: 1,
        lineHeight: 18,
    },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        height: 52,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    confirmBtnDisabled: {
        opacity: 0.45,
    },
    confirmBtnText: {
        ...typography.button,
        color: colors.onPrimary,
    },
    modalFootnote: {
        ...typography.small,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
    },

    // ─── Epic Modal ──────────────────────────────────────────────────────────
    modeSelector: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    modeTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: 10,
    },
    modeTabActive: {
        backgroundColor: colors.background,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    modeTabText: {
        ...typography.small,
        color: colors.textTertiary,
        fontWeight: '500',
    },
    modeTabTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    modalBodyContent: {
        paddingBottom: spacing.xxl,
    },
    openBrowserBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: 12,
        marginBottom: spacing.lg,
    },
    openBrowserText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
    stepsBox: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        ...typography.small,
        color: colors.onPrimary,
        fontWeight: '600',
    },
    stepText: {
        ...typography.small,
        color: colors.textSecondary,
        flex: 1,
        paddingTop: 4,
        lineHeight: 18,
    },
    modalLabel: {
        ...typography.small,
        color: colors.textTertiary,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: spacing.xs,
    },
    epicModalInput: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.textPrimary,
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
        height: 200,
    },
});
