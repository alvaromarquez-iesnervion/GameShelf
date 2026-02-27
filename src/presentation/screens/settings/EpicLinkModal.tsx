import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinkStep } from '../../components/platforms/LinkStep';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formStyles } from '../../styles/forms';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type EpicMode = 'authcode' | 'gdpr';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EpicLinkModalProps {
    visible: boolean;
    isLinking: boolean;
    errorMessage: string | null;
    onConfirmAuthCode: (code: string) => Promise<void>;
    onConfirmGdpr: (json: string) => Promise<void>;
    onOpenLogin: () => void;
    onOpenBrowser: () => void;
    onClose: () => void;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export const EpicLinkModal: React.FC<EpicLinkModalProps> = ({
    visible,
    isLinking,
    errorMessage,
    onConfirmAuthCode,
    onConfirmGdpr,
    onOpenLogin,
    onOpenBrowser,
    onClose,
}) => {
    const [mode, setMode] = useState<EpicMode>('authcode');
    const [input, setInput] = useState('');

    const handleClose = () => {
        setInput('');
        setMode('authcode');
        onClose();
    };

    const handleSwitchMode = (newMode: EpicMode) => {
        setInput('');
        setMode(newMode);
    };

    const handleConfirm = async () => {
        if (mode === 'authcode') {
            await onConfirmAuthCode(input);
        } else {
            await onConfirmGdpr(input);
        }
    };

    const isConfirmDisabled = !input.trim() || isLinking;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="formSheet"
            onRequestClose={handleClose}
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
                        onPress={handleClose}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Feather name="x" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Selector de modo */}
                <View style={styles.modeSelector}>
                    <TouchableOpacity
                        style={[styles.modeTab, mode === 'authcode' && styles.modeTabActive]}
                        onPress={() => handleSwitchMode('authcode')}
                        activeOpacity={0.75}
                    >
                        <Feather
                            name="zap"
                            size={13}
                            color={mode === 'authcode' ? colors.primary : colors.textTertiary}
                        />
                        <Text style={[styles.modeTabText, mode === 'authcode' && styles.modeTabTextActive]}>
                            Inicio de sesión
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeTab, mode === 'gdpr' && styles.modeTabActive]}
                        onPress={() => handleSwitchMode('gdpr')}
                        activeOpacity={0.75}
                    >
                        <Feather
                            name="file-text"
                            size={13}
                            color={mode === 'gdpr' ? colors.primary : colors.textTertiary}
                        />
                        <Text style={[styles.modeTabText, mode === 'gdpr' && styles.modeTabTextActive]}>
                            Importar JSON
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.modalBody}
                    contentContainerStyle={styles.modalBodyContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {mode === 'authcode' ? (
                        <AuthCodeForm
                            input={input}
                            onChangeInput={setInput}
                            isLinking={isLinking}
                            errorMessage={errorMessage}
                            isConfirmDisabled={isConfirmDisabled}
                            onOpenLogin={onOpenLogin}
                            onOpenBrowser={onOpenBrowser}
                            onConfirm={handleConfirm}
                        />
                    ) : (
                        <GdprForm
                            input={input}
                            onChangeInput={setInput}
                            isLinking={isLinking}
                            errorMessage={errorMessage}
                            isConfirmDisabled={isConfirmDisabled}
                            onConfirm={handleConfirm}
                        />
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── Formulario Auth Code ─────────────────────────────────────────────────────

interface AuthCodeFormProps {
    input: string;
    onChangeInput: (text: string) => void;
    isLinking: boolean;
    errorMessage: string | null;
    isConfirmDisabled: boolean;
    onOpenLogin: () => void;
    onOpenBrowser: () => void;
    onConfirm: () => void;
}

const AuthCodeForm: React.FC<AuthCodeFormProps> = ({
    input,
    onChangeInput,
    isLinking,
    errorMessage,
    isConfirmDisabled,
    onOpenLogin,
    onOpenBrowser,
    onConfirm,
}) => (
    <>
        <Text style={styles.modalInstruction}>
            Inicia sesión en Epic Games y obtén tu código de autorización:
        </Text>

        <View style={styles.stepsBox}>
            <LinkStep number={1} text='Pulsa "Iniciar sesión en Epic" e inicia sesión con tu cuenta' />
            <LinkStep number={2} text='Pulsa "Obtener código". Verás un JSON — copia el valor de "authorizationCode"' />
            <LinkStep number={3} text='Si "authorizationCode" aparece como null, vuelve al paso 1 e inicia sesión primero' />
        </View>

        <TouchableOpacity style={styles.openBrowserBtn} onPress={onOpenLogin} activeOpacity={0.8}>
            <Feather name="log-in" size={15} color={colors.primary} />
            <Text style={styles.openBrowserText}>Iniciar sesión en Epic Games</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.openBrowserBtn, styles.openBrowserBtnSecondary]} onPress={onOpenBrowser} activeOpacity={0.8}>
            <Feather name="external-link" size={15} color={colors.textSecondary} />
            <Text style={[styles.openBrowserText, styles.openBrowserTextSecondary]}>Obtener código de autorización</Text>
        </TouchableOpacity>

        <Text style={styles.modalLabel}>Pega el valor de "authorizationCode" aquí:</Text>
        <TextInput
            style={formStyles.modalInput}
            placeholder="Ej: a1b2c3d4e5f6..."
            placeholderTextColor={colors.textDisabled}
            value={input}
            onChangeText={onChangeInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
            returnKeyType="done"
            onSubmitEditing={onConfirm}
        />

        <ModalError message={errorMessage} />

        <ConfirmButton isDisabled={isConfirmDisabled} isLinking={isLinking} onPress={onConfirm} label="Vincular Epic Games" />

        <Text style={styles.modalFootnote}>
            El código caduca en ~5 minutos.{'\n'}
            Usa una API interna de Epic — puede cambiar sin previo aviso.
        </Text>
    </>
);

// ─── Formulario GDPR ──────────────────────────────────────────────────────────

interface GdprFormProps {
    input: string;
    onChangeInput: (text: string) => void;
    isLinking: boolean;
    errorMessage: string | null;
    isConfirmDisabled: boolean;
    onConfirm: () => void;
}

const GdprForm: React.FC<GdprFormProps> = ({
    input,
    onChangeInput,
    isLinking,
    errorMessage,
    isConfirmDisabled,
    onConfirm,
}) => (
    <>
        <Text style={styles.modalInstruction}>
            Descarga tu biblioteca de Epic manualmente:
        </Text>

        <View style={styles.stepsBox}>
            <LinkStep number={1} text="Ve a epicgames.com/account/privacy" />
            <LinkStep number={2} text="Haz clic en 'Descargar tus datos personales'" />
            <LinkStep number={3} text="Espera 24-48 horas y descarga el ZIP" />
            <LinkStep number={4} text="Abre 'entitlementGrantByEntitlementName.json' y cópialo" />
        </View>

        <Text style={styles.modalLabel}>Pega el contenido del JSON aquí:</Text>
        <TextInput
            style={styles.epicModalInput}
            placeholder="Pega el contenido JSON..."
            placeholderTextColor={colors.textDisabled}
            value={input}
            onChangeText={onChangeInput}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
        />

        <ModalError message={errorMessage} />

        <ConfirmButton isDisabled={isConfirmDisabled} isLinking={isLinking} onPress={onConfirm} label="Vincular Epic Games" />

        <Text style={styles.modalFootnote}>
            Tu JSON nunca se comparte con servidores externos.{'\n'}
            Solo se procesa localmente en tu dispositivo.
        </Text>
    </>
);

// ─── Componentes auxiliares internos ─────────────────────────────────────────

const ModalError: React.FC<{ message: string | null }> = ({ message }) =>
    message ? (
        <View style={styles.modalError}>
            <Feather name="alert-circle" size={14} color={colors.error} />
            <Text style={styles.modalErrorText}>{message}</Text>
        </View>
    ) : null;

interface ConfirmButtonProps {
    isDisabled: boolean;
    isLinking: boolean;
    onPress: () => void;
    label: string;
}

const ConfirmButton: React.FC<ConfirmButtonProps> = ({ isDisabled, isLinking, onPress, label }) => (
    <TouchableOpacity
        style={[formStyles.confirmBtn, isDisabled && formStyles.confirmBtnDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
    >
        {isLinking ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
            <>
                <Feather name="link" size={16} color={colors.onPrimary} />
                <Text style={formStyles.confirmBtnText}>{label}</Text>
            </>
        )}
    </TouchableOpacity>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
        paddingVertical: spacing.sm,
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
    modalBody: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    modalBodyContent: {
        paddingBottom: spacing.xxl,
    },
    modalInstruction: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
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
    openBrowserBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    openBrowserText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
    openBrowserBtnSecondary: {
        borderColor: colors.border,
        marginTop: spacing.sm,
    },
    openBrowserTextSecondary: {
        color: colors.textSecondary,
        fontWeight: '500',
    },
    modalLabel: {
        ...typography.small,
        color: colors.textTertiary,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: spacing.xs,
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
    modalFootnote: {
        ...typography.small,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
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
