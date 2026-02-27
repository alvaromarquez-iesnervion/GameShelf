import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formStyles } from '../../styles/forms';

// ─── Subcomponente local: ejemplo de formato de entrada ──────────────────────

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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SteamLinkModalProps {
    visible: boolean;
    isLinking: boolean;
    errorMessage: string | null;
    onConfirm: (steamInput: string) => Promise<void>;
    onClose: () => void;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export const SteamLinkModal: React.FC<SteamLinkModalProps> = ({
    visible,
    isLinking,
    errorMessage,
    onConfirm,
    onClose,
}) => {
    const [input, setInput] = useState('');

    const handleClose = () => {
        setInput('');
        onClose();
    };

    const handleConfirm = async () => {
        await onConfirm(input);
        // El screen padre limpia el input si el link fue exitoso (cierra el modal)
        // pero si falla, el input debe conservarse para que el usuario corrija
    };

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
                    <Text style={styles.modalTitle}>Vincular Steam</Text>
                    <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={handleClose}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Feather name="x" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Body */}
                <View style={styles.modalBody}>
                    <Text style={styles.modalInstruction}>
                        Introduce tu SteamID, URL de perfil o nombre de usuario de Steam:
                    </Text>

                    <View style={styles.examplesBox}>
                        <Example icon="hash" text="76561197960287930" label="SteamID" />
                        <Example icon="link" text="steamcommunity.com/id/tunombre" label="Perfil por nombre" />
                        <Example icon="link" text="steamcommunity.com/profiles/76561..." label="Perfil numérico" />
                    </View>

                    <TextInput
                        style={formStyles.modalInput}
                        placeholder="Introduce tu SteamID o URL..."
                        placeholderTextColor={colors.textDisabled}
                        value={input}
                        onChangeText={setInput}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardAppearance="dark"
                        returnKeyType="done"
                        onSubmitEditing={handleConfirm}
                    />

                    {errorMessage ? (
                        <View style={styles.modalError}>
                            <Feather name="alert-circle" size={14} color={colors.error} />
                            <Text style={styles.modalErrorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[
                            formStyles.confirmBtn,
                            (!input.trim() || isLinking) && formStyles.confirmBtnDisabled,
                        ]}
                        onPress={handleConfirm}
                        disabled={!input.trim() || isLinking}
                        activeOpacity={0.8}
                    >
                        {isLinking ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                        ) : (
                            <>
                                <Feather name="link" size={16} color={colors.onPrimary} />
                                <Text style={formStyles.confirmBtnText}>Vincular Steam</Text>
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
    );
};

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
    modalBody: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
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
});
