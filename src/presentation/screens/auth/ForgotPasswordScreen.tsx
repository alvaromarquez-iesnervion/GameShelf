import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { AuthStackParamList } from '../../../core/navigation/navigationTypes';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordScreen: React.FC<Props> = observer(({ navigation }) => {
    const vm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [focused, setFocused] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => {
        return () => vm.clearError();
    }, [vm]);

    const valid = EMAIL_RE.test(email.trim());
    const canSubmit = valid && !vm.isLoading;

    const onSubmit = async () => {
        if (!canSubmit) return;
        const ok = await vm.resetPassword(email.trim());
        if (ok) setSent(true);
    };

    return (
        <KeyboardAvoidingView
            style={[styles.flex, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={{ backgroundColor: colors.background }}
                contentContainerStyle={[
                    styles.scroll,
                    { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.back}
                    hitSlop={12}
                >
                    <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
                </Pressable>

                <View style={styles.iconWrap}>
                    <LinearGradient
                        colors={[colors.primaryDim, colors.secondaryDim]}
                        style={styles.iconCircle}
                    >
                        <Ionicons
                            name={sent ? 'mail-open-outline' : 'key-outline'}
                            size={32}
                            color={colors.primary}
                        />
                    </LinearGradient>
                </View>

                <Text style={styles.title}>
                    {sent ? 'Revisa tu email' : 'Recuperar contraseña'}
                </Text>
                <Text style={styles.subtitle}>
                    {sent
                        ? `Te hemos enviado un enlace a ${email.trim()} para restablecer la contraseña.`
                        : 'Introduce tu email y te enviaremos un enlace para crear una contraseña nueva.'}
                </Text>

                {!sent && (
                    <View style={styles.card}>
                        {vm.errorMessage && (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={16} color={colors.error} />
                                <Text style={styles.errorText}>{vm.errorMessage}</Text>
                            </View>
                        )}

                        <Text style={styles.label}>Email</Text>
                        <View
                            style={[
                                styles.inputWrap,
                                focused && styles.inputWrapFocused,
                            ]}
                        >
                            <Ionicons
                                name="mail-outline"
                                size={18}
                                color={focused ? colors.primary : colors.textTertiary}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="tu@email.com"
                                placeholderTextColor={colors.textTertiary}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoComplete="email"
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                editable={!vm.isLoading}
                            />
                        </View>

                        <Pressable
                            onPress={onSubmit}
                            disabled={!canSubmit}
                            style={({ pressed }) => [
                                styles.cta,
                                !canSubmit && styles.ctaWeak,
                                pressed && canSubmit && styles.ctaPressed,
                            ]}
                        >
                            <LinearGradient
                                colors={
                                    canSubmit
                                        ? [colors.primary, colors.primaryLight]
                                        : [colors.surfaceVariant, colors.surfaceVariant]
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.ctaGradient}
                            >
                                <Text style={styles.ctaText}>
                                    {vm.isLoading ? 'Enviando…' : 'Enviar enlace'}
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </View>
                )}

                {sent && (
                    <Pressable
                        onPress={() => navigation.navigate('Login')}
                        style={({ pressed }) => [
                            styles.cta,
                            { marginTop: spacing.xl },
                            pressed && styles.ctaPressed,
                        ]}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primaryLight]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.ctaGradient}
                        >
                            <Text style={styles.ctaText}>Volver al inicio</Text>
                        </LinearGradient>
                    </Pressable>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
    },
    back: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: spacing.xl,
    },
    iconWrap: { alignItems: 'center', marginVertical: spacing.lg },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primaryBorder,
    },
    title: { ...typography.heading, fontSize: 28, textAlign: 'center', marginTop: spacing.md },
    subtitle: {
        ...typography.bodySecondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.errorBackground,
        borderColor: colors.errorBorder,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
    },
    errorText: { ...typography.bodySecondary, color: colors.error, flex: 1 },
    label: { ...typography.label, marginBottom: spacing.xs },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.inputBackground,
        borderColor: colors.inputBorder,
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        height: 48,
    },
    inputWrapFocused: {
        borderColor: colors.inputFocusBorder,
        backgroundColor: colors.surfaceElevated,
    },
    input: { ...typography.input, flex: 1, paddingVertical: 0 },
    cta: {
        marginTop: spacing.lg,
        borderRadius: radius.lg,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    ctaWeak: { shadowOpacity: 0 },
    ctaPressed: { opacity: 0.85 },
    ctaGradient: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaText: { ...typography.button, color: colors.onPrimary },
});
