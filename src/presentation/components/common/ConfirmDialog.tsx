import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadows } from '../../theme/spacing';

export interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Modal centrado para confirmar acciones destructivas (logout, borrar datos).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    visible,
    title,
    message,
    confirmText,
    cancelText = 'Cancelar',
    destructive = false,
    onConfirm,
    onCancel,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
                <View style={styles.dialog}>
                    <Text style={[typography.subheading, styles.title]}>{title}</Text>
                    <Text style={[typography.bodySecondary, styles.message]}>{message}</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, destructive && styles.cancelDestructive]}
                            onPress={onCancel}
                        >
                            <Text style={[typography.button, { color: colors.primary }]}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                destructive ? styles.confirmDestructive : styles.buttonSolid,
                            ]}
                            onPress={onConfirm}
                        >
                            <Text
                                style={[
                                    typography.button,
                                    { color: destructive ? colors.error : colors.onPrimary },
                                ]}
                            >
                                {confirmText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialog: {
        width: '85%',
        maxWidth: 340,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.xl,
        padding: spacing.xl,
        ...shadows.medium,
    },
    title: {
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    message: {
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelDestructive: {
        backgroundColor: colors.surfaceVariant,
    },
    confirmDestructive: {
        borderWidth: 1,
        borderColor: colors.errorBorder,
        backgroundColor: colors.errorBackground,
    },
    buttonSolid: {
        backgroundColor: colors.primary,
    },
});
