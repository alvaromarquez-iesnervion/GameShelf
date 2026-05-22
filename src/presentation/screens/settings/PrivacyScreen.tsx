import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { Feather } from '@expo/vector-icons';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Screen } from '../../components/common/Screen';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export const PrivacyScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const onConfirmDelete = useCallback(async () => {
        setConfirmOpen(false);
        try {
            await authVm.deleteAccount();
        } catch {
            Alert.alert('Error', authVm.errorMessage ?? 'No se pudo eliminar la cuenta.');
        }
    }, [authVm]);

    return (
        <Screen topInset="header">
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.iconWrap}>
                    <View style={styles.iconBox}>
                        <Feather name="shield" size={24} color={colors.success} />
                    </View>
                </View>

                <Text style={styles.title}>Tu privacidad</Text>
                <Text style={styles.body}>
                    GameShelf solo guarda los datos imprescindibles para sincronizar tu biblioteca,
                    tu wishlist y tus preferencias. Nada se comparte con terceros.
                </Text>

                <View style={styles.card}>
                    <Bullet text="Tus credenciales nunca se almacenan: la autenticación se delega a Firebase." />
                    <Bullet text="Las claves OAuth de Steam, Epic, GOG y PSN se cifran y se borran al desvincular." />
                    <Bullet text="Puedes eliminar tu cuenta y todos sus datos en cualquier momento." />
                </View>

                <Text style={styles.sectionLabel}>Zona peligrosa</Text>

                <Pressable
                    style={({ pressed }) => [styles.danger, pressed && { opacity: 0.85 }]}
                    onPress={() => setConfirmOpen(true)}
                >
                    <Feather name="trash-2" size={18} color={colors.error} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.dangerTitle}>Eliminar cuenta</Text>
                        <Text style={styles.dangerHint}>Borra tu perfil, biblioteca, wishlist y vínculos. Esta acción es irreversible.</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.error} />
                </Pressable>
            </ScrollView>

            <ConfirmDialog
                visible={confirmOpen}
                title="Eliminar cuenta"
                message="Vas a borrar permanentemente tu cuenta y todos sus datos. ¿Seguro que quieres continuar?"
                confirmText="Eliminar"
                onConfirm={onConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
                destructive
            />
        </Screen>
    );
});

const Bullet: React.FC<{ text: string }> = ({ text }) => (
    <View style={styles.bulletRow}>
        <View style={styles.bulletDot} />
        <Text style={styles.bulletText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    scroll: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg },
    iconWrap: { alignItems: 'center', marginTop: spacing.md },
    iconBox: {
        width: 64, height: 64,
        borderRadius: radius.full,
        backgroundColor: colors.successBackground,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.4)',
    },
    title: { ...typography.heading, fontSize: 28, textAlign: 'center' },
    body: { ...typography.bodySecondary, textAlign: 'center', paddingHorizontal: spacing.md },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1, borderColor: colors.borderSubtle,
        gap: spacing.md,
    },
    bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    bulletDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: colors.primary,
        marginTop: 8,
    },
    bulletText: { ...typography.bodySecondary, color: colors.textPrimary, flex: 1 },
    sectionLabel: { ...typography.label, color: colors.error, marginTop: spacing.md },
    danger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.errorBackground,
        borderWidth: 1, borderColor: colors.errorBorder,
    },
    dangerTitle: { ...typography.body, color: colors.error, fontWeight: '600' },
    dangerHint: { ...typography.caption, color: colors.error, marginTop: 2 },
});
