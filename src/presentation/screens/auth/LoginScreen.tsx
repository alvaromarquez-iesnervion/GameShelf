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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = observer(({ navigation }) => {
    const vm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [focused, setFocused] = useState<'email' | 'pwd' | null>(null);

    useEffect(() => {
        return () => vm.clearError();
    }, [vm]);

    const canSubmit = email.trim().length > 0 && password.length > 0 && !vm.isLoading;

    const onSubmit = async () => {
        if (!canSubmit) return;
        await vm.login(email.trim(), password);
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
                    { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xl },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.brandWrap}>
                    <LinearGradient
                        colors={[colors.primary, colors.secondary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.logo}
                    >
                        <Ionicons name="game-controller" size={32} color={colors.onPrimary} />
                    </LinearGradient>
                    <Text style={styles.appName}>GameShelf</Text>
                    <Text style={styles.tagline}>Tu biblioteca, en un solo sitio</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Bienvenido de nuevo</Text>
                    <Text style={styles.subtitle}>Inicia sesión para continuar</Text>

                    {vm.errorMessage && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color={colors.error} />
                            <Text style={styles.errorText}>{vm.errorMessage}</Text>
                        </View>
                    )}

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View
                            style={[
                                styles.inputWrap,
                                focused === 'email' && styles.inputWrapFocused,
                            ]}
                        >
                            <Ionicons
                                name="mail-outline"
                                size={18}
                                color={focused === 'email' ? colors.primary : colors.textTertiary}
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
                                onFocus={() => setFocused('email')}
                                onBlur={() => setFocused(null)}
                                editable={!vm.isLoading}
                            />
                        </View>
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Contraseña</Text>
                        <View
                            style={[
                                styles.inputWrap,
                                focused === 'pwd' && styles.inputWrapFocused,
                            ]}
                        >
                            <Ionicons
                                name="lock-closed-outline"
                                size={18}
                                color={focused === 'pwd' ? colors.primary : colors.textTertiary}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={colors.textTertiary}
                                secureTextEntry={!showPwd}
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocused('pwd')}
                                onBlur={() => setFocused(null)}
                                editable={!vm.isLoading}
                            />
                            <Pressable hitSlop={8} onPress={() => setShowPwd((s) => !s)}>
                                <Ionicons
                                    name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                                    size={18}
                                    color={colors.textSecondary}
                                />
                            </Pressable>
                        </View>
                    </View>

                    <Pressable
                        onPress={() => navigation.navigate('ForgotPassword')}
                        hitSlop={8}
                        style={styles.forgotWrap}
                    >
                        <Text style={styles.linkSubtle}>¿Has olvidado la contraseña?</Text>
                    </Pressable>

                    <Pressable
                        onPress={onSubmit}
                        disabled={!canSubmit}
                        style={({ pressed }) => [
                            styles.cta,
                            !canSubmit && styles.ctaDisabled,
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
                                {vm.isLoading ? 'Entrando…' : 'Entrar'}
                            </Text>
                        </LinearGradient>
                    </Pressable>

                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>o</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    <Pressable
                        onPress={() => vm.continueAsGuest()}
                        disabled={vm.isLoading}
                        style={({ pressed }) => [
                            styles.secondary,
                            pressed && styles.secondaryPressed,
                        ]}
                    >
                        <Ionicons name="person-outline" size={18} color={colors.secondary} />
                        <Text style={styles.secondaryText}>Continuar como invitado</Text>
                    </Pressable>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerHint}>¿Aún no tienes cuenta? </Text>
                    <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
                        <Text style={styles.footerLink}>Crear cuenta</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    flex: { flex: 1 },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: spacing.xl,
        justifyContent: 'center',
    },
    brandWrap: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: radius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        shadowColor: colors.primary,
        shadowOpacity: 0.45,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    appName: {
        ...typography.heading,
        fontSize: 30,
        letterSpacing: -0.5,
    },
    tagline: {
        ...typography.bodySecondary,
        marginTop: spacing.xs,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    title: { ...typography.subheading },
    subtitle: {
        ...typography.bodySecondary,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
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
    label: {
        ...typography.label,
        marginBottom: spacing.xs,
    },
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
    input: {
        ...typography.input,
        flex: 1,
        paddingVertical: 0,
    },
    forgotWrap: { alignSelf: 'flex-end', marginTop: spacing.xs, marginBottom: spacing.lg },
    linkSubtle: {
        ...typography.bodySecondary,
        color: colors.secondary,
    },
    cta: {
        borderRadius: radius.lg,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    ctaDisabled: { shadowOpacity: 0 },
    ctaPressed: { opacity: 0.85 },
    ctaGradient: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaText: { ...typography.button, color: colors.onPrimary },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginVertical: spacing.lg,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
    dividerText: { ...typography.caption },
    secondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        height: 48,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.secondaryDim,
        backgroundColor: 'transparent',
    },
    secondaryPressed: { backgroundColor: colors.secondaryDim },
    secondaryText: { ...typography.button, color: colors.secondary, fontSize: 15 },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    footerHint: { ...typography.bodySecondary },
    footerLink: { ...typography.bodySecondary, color: colors.secondary, fontWeight: '600' },
});
