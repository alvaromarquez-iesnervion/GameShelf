import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { TYPES } from '../../../di/types';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../theme/colors';
import { strings } from '../../../core/constants/strings';
import { StyleSheet } from 'react-native';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
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
        gap: spacing.md,
    },
    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: colors.iosRed,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    rowTitle: {
        ...typography.body,
        fontWeight: '500',
        color: colors.iosRed,
    },
    rowDescription: {
        ...typography.small,
        color: colors.textSecondary,
        lineHeight: 17,
        marginTop: 2,
    },
    footnote: {
        ...typography.small,
        color: colors.textTertiary,
        marginTop: spacing.md,
        marginHorizontal: spacing.sm,
        lineHeight: 18,
    },
});

export const PrivacyScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

    const handleDeletePress = useCallback(() => {
        setDeleteConfirmVisible(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        setDeleteConfirmVisible(false);
        try {
            await authVm.deleteAccount();
        } catch {
            Alert.alert(strings.deleteAccountTitle, strings.deleteAccountError);
        }
    }, [authVm]);

    const handleDeleteCancel = useCallback(() => {
        setDeleteConfirmVisible(false);
    }, []);

    return (
        <Screen style={styles.container} topInset="header">
            <Text style={styles.sectionLabel}>DATOS DE CUENTA</Text>

            <View style={styles.group}>
                <TouchableOpacity style={styles.row} onPress={handleDeletePress} activeOpacity={0.7}>
                    <View style={styles.iconBox}>
                        <Feather name="trash-2" size={18} color={colors.onPrimary} />
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.rowTitle}>{strings.deleteAccountTitle}</Text>
                        <Text style={styles.rowDescription}>Elimina tu cuenta y todos los datos asociados</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
            </View>

            <Text style={styles.footnote}>{strings.deleteAccountMessage}</Text>

            <ConfirmDialog
                visible={deleteConfirmVisible}
                title={strings.deleteAccountTitle}
                message={strings.deleteAccountMessage}
                confirmText={strings.deleteAccountConfirm}
                destructive
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </Screen>
    );
});
PrivacyScreen.displayName = 'PrivacyScreen';
