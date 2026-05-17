import React, { useEffect, useMemo, useState } from 'react';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FocusField = 'email' | 'pwd' | 'confirm';

export const RegisterScreen: React.FC<Props> = observer(({ navigation }) => {
    const vm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [focused, setFocused] = useState<FocusField | null>(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        return () => vm.clearError();
    }, [vm]);

    const strength = useMemo(() => {
        if (password.length === 0) return 0;
        let s = 0;
        if (password.length >= 8) s++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s++;
        if (/\d/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    }, [password]);

    const emailValid = EMAIL_RE.test(email.trim());
    const pwdValid = password.length >= 8;
    const matchValid = password.length > 0 && password === confirm;
    const canSubmit = emailValid && pwdValid && matchValid && !vm.isLoading;

    const onSubmit = async () => {
        setSubmitted(true);
        if (!canSubmit) return;
        await vm.register(email.trim(), password);
    };

    const showEmailErr = submitted && !emailValid;
    const showPwdErr = submitted && !pwdValid;
    const showMatchErr = submitted && password.length > 0 && !matchValid;

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

                <View style={styles.header}>
                    <Text style={styles.title}>Crear cuenta</Text>
                    <Text style={styles.subtitle}>
                        Empieza a organizar tu colección de juegos
                    </Text>
                </View>

                <View style={styles.card}>
                    {vm.errorMessage && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color={colors.error} />
                            <Text style={styles.errorText}>{vm.errorMessage}</Text>
                        </View>
                    )}

                    <FormField
                        label="Email"
                        icon="mail-outline"
                        focused={focused === 'email'}
                        onFocus={() => setFocused('email')}
                        onBlur={() => setFocused(null)}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="tu@email.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoComplete="email"
                        error={showEmailErr ? 'Introduce un email válido' : null}
                        editable={!vm.isLoading}
                    />

                    <FormField
                        label="Contraseña"
                        icon="lock-closed-outline"
                        focused={focused === 'pwd'}
                        onFocus={() => setFocused('pwd')}
                        onBlur={() => setFocused(null)}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mínimo 8 caracteres"
                        secureTextEntry={!showPwd}
                        right={
                            <Pressable hitSlop={8} onPress={() => setShowPwd((s) => !s)}>
                                <Ionicons
                                    name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                                    size={18}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        }
                        error={showPwdErr ? 'Al menos 8 caracteres' : null}
                        editable={!vm.isLoading}
                    />

                    {password.length > 0 && (
                        <View style={styles.strength}>
                            {[0, 1, 2, 3].map((i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.strengthSeg,
                                        {
                                            backgroundColor:
                                                i < strength
                                                    ? strengthColor(strength)
                                                    : colors.surfaceVariant,
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    )}

                    <FormField
                        label="Confirmar contraseña"
                        icon="shield-checkmark-outline"
                        focused={focused === 'confirm'}
                        onFocus={() => setFocused('confirm')}
                        onBlur={() => setFocused(null)}
                        value={confirm}
                        onChangeText={setConfirm}
                        placeholder="Repite la contraseña"
                        secureTextEntry={!showPwd}
                        error={showMatchErr ? 'Las contraseñas no coinciden' : null}
                        editable={!vm.isLoading}
                    />

                    <Pressable
                        onPress={onSubmit}
                        disabled={vm.isLoading}
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
                                {vm.isLoading ? 'Creando…' : 'Crear cuenta'}
                            </Text>
                        </LinearGradient>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerHint}>¿Ya tienes cuenta? </Text>
                    <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
                        <Text style={styles.footerLink}>Iniciar sesión</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
});

function strengthColor(s: number): string {
    if (s <= 1) return colors.error;
    if (s === 2) return colors.warning;
    if (s === 3) return colors.secondary;
    return colors.success;
}

interface FormFieldProps {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    focused: boolean;
    onFocus: () => void;
    onBlur: () => void;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
    error?: string | null;
    right?: React.ReactNode;
    secureTextEntry?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    keyboardType?: 'default' | 'email-address';
    autoComplete?: 'email' | 'password';
    editable?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
    label,
    icon,
    focused,
    onFocus,
    onBlur,
    value,
    onChangeText,
    placeholder,
    error,
    right,
    secureTextEntry,
    autoCapitalize,
    keyboardType,
    autoComplete,
    editable,
}) => (
    <View style={styles.fieldGroup}>
        <Text style={styles.label}>{label}</Text>
        <View
            style={[
                styles.inputWrap,
                focused && styles.inputWrapFocused,
                error && styles.inputWrapError,
            ]}
        >
            <Ionicons
                name={icon}
                size={18}
                color={focused ? colors.primary : colors.textTertiary}
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.textTertiary}
                value={value}
                onChangeText={onChangeText}
                onFocus={onFocus}
                onBlur={onBlur}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
                keyboardType={keyboardType}
                autoComplete={autoComplete}
                editable={editable}
            />
            {right}
        </View>
        {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
);

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
        marginBottom: spacing.lg,
    },
    header: { marginBottom: spacing.xl },
    title: { ...typography.heading, fontSize: 32 },
    subtitle: { ...typography.bodySecondary, marginTop: spacing.xs },
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
    fieldGroup: { marginBottom: spacing.md },
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
    inputWrapError: { borderColor: colors.error },
    input: { ...typography.input, flex: 1, paddingVertical: 0 },
    fieldError: {
        ...typography.caption,
        color: colors.error,
        marginTop: spacing.xs,
    },
    strength: {
        flexDirection: 'row',
        gap: 4,
        marginTop: -spacing.sm,
        marginBottom: spacing.md,
    },
    strengthSeg: {
        flex: 1,
        height: 3,
        borderRadius: radius.xs,
    },
    cta: {
        marginTop: spacing.sm,
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    footerHint: { ...typography.bodySecondary },
    footerLink: { ...typography.bodySecondary, color: colors.secondary, fontWeight: '600' },
});
