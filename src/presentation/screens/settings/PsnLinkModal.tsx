import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formStyles } from '../../styles/forms';
import { LinkStep } from '../../components/platforms/LinkStep';

export interface PsnLinkModalProps {
    visible: boolean;
    isLinking: boolean;
    errorMessage: string | null;
    onLink: () => Promise<void>;
    onClose: () => void;
}

export const PsnLinkModal: React.FC<PsnLinkModalProps> = ({
    visible,
    isLinking,
    errorMessage,
    onLink,
    onClose,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="formSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.handle} />
                    <View style={styles.backBtn} />
                    <Text style={styles.title}>Vincular PlayStation</Text>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={onClose}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Feather name="x" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.body}>
                    <Text style={styles.instruction}>
                        Conecta tu cuenta de PlayStation para sincronizar tu biblioteca:
                    </Text>

                    <View style={styles.stepsBox}>
                        <LinkStep number={1} text='Pulsa "Conectar con PlayStation"' />
                        <LinkStep number={2} text="Se abrirá Safari para iniciar sesión" />
                        <LinkStep number={3} text="Inicia sesión con tu cuenta de PlayStation" />
                        <LinkStep number={4} text="La app sincronizará tu biblioteca automáticamente" />
                    </View>

                    {errorMessage ? (
                        <View style={styles.errorBox}>
                            <Feather name="alert-circle" size={14} color={colors.error} />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[formStyles.confirmBtn, isLinking && formStyles.confirmBtnDisabled]}
                        onPress={onLink}
                        disabled={isLinking}
                        activeOpacity={0.8}
                    >
                        {isLinking ? (
                            <ActivityIndicator size="small" color={colors.onPrimary} />
                        ) : (
                            <>
                                <Feather name="link" size={16} color={colors.onPrimary} />
                                <Text style={formStyles.confirmBtnText}>Conectar con PlayStation</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.footnote}>
                        Usa la API no oficial de PSN.{'\n'}
                        Solo muestra juegos que hayas iniciado al menos una vez.{'\n'}
                        Puede cambiar sin previo aviso.
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    handle: {
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
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...typography.subheading,
        flex: 1,
        textAlign: 'center',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    instruction: {
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
    errorBox: {
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
    errorText: {
        ...typography.small,
        color: colors.error,
        flex: 1,
        lineHeight: 18,
    },
    footnote: {
        ...typography.small,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: spacing.md,
    },
});
