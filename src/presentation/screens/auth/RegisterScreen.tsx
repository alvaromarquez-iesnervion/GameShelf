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
    ScrollView,
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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const navigation = useNavigation<Nav>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleRegister = async () => {
        setLocalError(null);
        if (!email.trim() || !password.trim()) {
            setLocalError('Rellena todos los campos');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        if (password.length < 6) {
            setLocalError('La contraseña debe tener al menos 6 caracteres');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await authVm.register(email.trim(), password);
    };

    const handleGoBack = () => {
        Haptics.selectionAsync();
        authVm.clearError();
        navigation.goBack();
    };

    const displayError = localError ?? authVm.errorMessage;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['rgba(94, 92, 230, 0.1)', 'transparent']}
                style={styles.topGradient}
                pointerEvents="none"
            />

            {/* Back button — top-left, outside scroll so it's always visible */}
            <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.7}>
                <Feather name="arrow-left" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headingSection}>
                    <Text style={styles.title}>Crear cuenta</Text>
                    <Text style={styles.subtitle}>Únete a GameShelf</Text>
                </View>

                {displayError ? (
                    <View style={styles.errorBanner}>
                        <Feather name="alert-circle" size={15} color={colors.error} />
                        <Text style={styles.errorText}>{displayError}</Text>
                    </View>
                ) : null}

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

                    <View style={[styles.inputWrap, focusedField === 'password' && styles.inputFocused]}>
                        <Feather
                            name="lock"
                            size={18}
                            color={focusedField === 'password' ? colors.primary : colors.textTertiary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Contraseña"
                            placeholderTextColor={colors.textDisabled}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            keyboardAppearance="dark"
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity
                            style={styles.eyeBtn}
                            onPress={() => setShowPassword(!showPassword)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputWrap, focusedField === 'confirm' && styles.inputFocused]}>
                        <Feather
                            name="lock"
                            size={18}
                            color={focusedField === 'confirm' ? colors.primary : colors.textTertiary}
                            style={styles.inputIcon}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirmar contraseña"
                            placeholderTextColor={colors.textDisabled}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            keyboardAppearance="dark"
                            onFocus={() => setFocusedField('confirm')}
                            onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity
                            style={styles.eyeBtn}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryBtn, authVm.isLoading && styles.primaryBtnDisabled]}
                        onPress={handleRegister}
                        disabled={authVm.isLoading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#6B69F0', '#5E5CE6']}
                            style={styles.primaryBtnGradient}
                        >
                            {authVm.isLoading ? (
                                <Text style={styles.primaryBtnText}>Registrando...</Text>
                            ) : (
                                <>
                                    <Text style={styles.primaryBtnText}>Crear cuenta</Text>
                                    <Feather name="user-plus" size={17} color={colors.onPrimary} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.footerLink} onPress={handleGoBack} activeOpacity={0.7}>
                    <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                    <Text style={styles.footerTextBold}>Inicia sesión</Text>
                </TouchableOpacity>
            </ScrollView>
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
        height: 280,
    },
    backBtn: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 24,
        left: spacing.lg,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
        paddingTop: Platform.OS === 'ios' ? 120 : 80,
        paddingBottom: spacing.xxl,
    },
    headingSection: {
        marginBottom: 36,
    },
    title: {
        fontSize: 34,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        letterSpacing: 0.37,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textSecondary,
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
    eyeBtn: {
        paddingRight: 16,
        paddingLeft: 8,
    },
    primaryBtn: {
        marginTop: spacing.sm,
        borderRadius: radius.md,
        overflow: 'hidden',
    },
    primaryBtnDisabled: {
        opacity: 0.55,
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
    footerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xxl,
    },
    footerText: {
        ...typography.body,
        fontSize: 15,
        color: colors.textSecondary,
    },
    footerTextBold: {
        ...typography.body,
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary,
    },
});
