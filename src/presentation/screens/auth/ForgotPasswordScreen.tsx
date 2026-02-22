import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { TYPES } from '../../../di/types';
import { AuthStackParamList } from '../../../core/navigation/navigationTypes';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const navigation = useNavigation<Nav>();

    const [email, setEmail] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await authVm.resetPassword(email.trim());
        if (success) {
            setEmailSent(true);
        }
    };

    const handleBack = () => {
        authVm.clearError();
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />

            {/* Background gradient top accent */}
            <LinearGradient
                colors={['rgba(10, 132, 255, 0.12)', 'transparent']}
                style={styles.topGradient}
                pointerEvents="none"
            />

            <View style={styles.content}>
                {/* Back button */}
                <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
                    <Feather name="arrow-left" size={20} color={colors.textSecondary} />
                    <Text style={styles.backText}>Volver</Text>
                </TouchableOpacity>

                {emailSent ? (
                    /* ── Estado éxito ── */
                    <View style={styles.successContainer}>
                        <View style={styles.successIcon}>
                            <Feather name="mail" size={36} color={colors.success} />
                        </View>
                        <Text style={styles.title}>Correo enviado</Text>
                        <Text style={styles.subtitle}>
                            Hemos enviado un enlace de recuperación a{'\n'}
                            <Text style={styles.emailHighlight}>{email}</Text>
                        </Text>
                        <Text style={styles.hintText}>
                            Revisa tu bandeja de entrada y sigue las instrucciones. Si no lo ves, comprueba la carpeta de spam.
                        </Text>
                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            onPress={handleBack}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.secondaryBtnText}>Volver al inicio de sesión</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* ── Formulario ── */
                    <>
                        <View style={styles.headerSection}>
                            <View style={styles.iconWrap}>
                                <Feather name="lock" size={32} color={colors.primary} />
                            </View>
                            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
                            <Text style={styles.subtitle}>
                                Introduce tu correo y te enviaremos un enlace para restablecerla.
                            </Text>
                        </View>

                        {/* Error */}
                        {authVm.errorMessage ? (
                            <View style={styles.errorBanner}>
                                <Feather name="alert-circle" size={15} color={colors.error} />
                                <Text style={styles.errorText}>{authVm.errorMessage}</Text>
                            </View>
                        ) : null}

                        {/* Form */}
                        <View style={styles.form}>
                            <View style={[styles.inputWrap, focusedField === 'email' && styles.inputFocused]}>
                                <Feather
                                    name="mail"
                                    size={18}
                                    color={focusedField === 'email' ? colors.primary : colors.textTertiary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Correo electrónico"
                                    placeholderTextColor={colors.textDisabled}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    keyboardAppearance="dark"
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.primaryBtn, (authVm.isLoading || !email.trim()) && styles.primaryBtnDisabled]}
                                onPress={handleReset}
                                disabled={authVm.isLoading || !email.trim()}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={['#1A91FF', '#0A84FF']}
                                    style={styles.primaryBtnGradient}
                                >
                                    {authVm.isLoading ? (
                                        <Text style={styles.primaryBtnText}>Enviando...</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.primaryBtnText}>Enviar enlace</Text>
                                            <Feather name="send" size={17} color={colors.onPrimary} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xxl,
        paddingTop: 60,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xxl,
        alignSelf: 'flex-start',
    },
    backText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 36,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: radius.xxl,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        letterSpacing: 0.3,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        ...typography.bodySecondary,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.errorBackground,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    errorText: {
        ...typography.small,
        color: colors.error,
        flex: 1,
    },
    form: {
        gap: spacing.md,
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        height: 52,
    },
    inputFocused: {
        borderColor: colors.primary,
    },
    inputIcon: {
        paddingLeft: 16,
        paddingRight: 4,
    },
    input: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        paddingVertical: 0,
        paddingRight: spacing.md,
    },
    primaryBtn: {
        marginTop: spacing.sm,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    primaryBtnDisabled: {
        opacity: 0.45,
    },
    primaryBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        gap: spacing.sm,
    },
    primaryBtnText: {
        ...typography.button,
        color: colors.onPrimary,
    },
    // ── Estado éxito ──
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 80,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: radius.xxl,
        backgroundColor: colors.successBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.success,
    },
    emailHighlight: {
        color: colors.primary,
        fontWeight: '600',
    },
    hintText: {
        ...typography.small,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.md,
        lineHeight: 20,
        paddingHorizontal: spacing.md,
    },
    secondaryBtn: {
        marginTop: spacing.xxl,
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    secondaryBtnText: {
        ...typography.button,
        color: colors.textPrimary,
    },
});
