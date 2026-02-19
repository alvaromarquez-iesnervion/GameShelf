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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const navigation = useNavigation<Nav>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await authVm.login(email.trim(), password);
    };

    const handleNavigateRegister = () => {
        Haptics.selectionAsync();
        authVm.clearError();
        navigation.navigate('Register');
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
                {/* Logo */}
                <View style={styles.logoSection}>
                    <View style={styles.logoIcon}>
                        <Feather name="layers" size={36} color={colors.primary} />
                    </View>
                    <Text style={styles.appName}>GameShelf</Text>
                    <Text style={styles.tagline}>Tu biblioteca de juegos unificada</Text>
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
                            <Feather
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={18}
                                color={colors.textTertiary}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryBtn, authVm.isLoading && styles.primaryBtnDisabled]}
                        onPress={handleLogin}
                        disabled={authVm.isLoading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#1A91FF', '#0A84FF']}
                            style={styles.primaryBtnGradient}
                        >
                            {authVm.isLoading ? (
                                <Text style={styles.primaryBtnText}>Entrando...</Text>
                            ) : (
                                <>
                                    <Text style={styles.primaryBtnText}>Iniciar sesión</Text>
                                    <Feather name="arrow-right" size={17} color={colors.onPrimary} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <TouchableOpacity style={styles.footerLink} onPress={handleNavigateRegister} activeOpacity={0.7}>
                    <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                    <Text style={styles.footerTextBold}>Regístrate</Text>
                </TouchableOpacity>
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
        justifyContent: 'center',
        paddingHorizontal: spacing.xxl,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoIcon: {
        width: 80,
        height: 80,
        borderRadius: radius.xxl,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    appName: {
        fontSize: 34,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        letterSpacing: 0.37,
        marginBottom: spacing.xs,
    },
    tagline: {
        ...typography.bodySecondary,
        color: colors.textSecondary,
        textAlign: 'center',
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
