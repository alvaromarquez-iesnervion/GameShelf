import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
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
import { formStyles, authBgGradientPrimary, primaryGradientColors } from '../../styles/forms';
import { styles } from './LoginScreen.styles';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const navigation = useNavigation<Nav>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleLogin = useCallback(async () => {
        if (!email.trim() || !password.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await authVm.login(email.trim(), password);
    }, [email, password, authVm]);

    const handleNavigateRegister = useCallback(() => {
        Haptics.selectionAsync();
        authVm.clearError();
        navigation.navigate('Register');
    }, [authVm, navigation]);

    const handleNavigateForgotPassword = useCallback(() => {
        Haptics.selectionAsync();
        authVm.clearError();
        navigation.navigate('ForgotPassword');
    }, [authVm, navigation]);

    const handleContinueAsGuest = useCallback(async () => {
        Haptics.selectionAsync();
        await authVm.continueAsGuest();
    }, [authVm]);

    const handleTogglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleFocusField = useCallback((field: string) => {
        setFocusedField(field);
    }, []);

    const handleBlurField = useCallback(() => {
        setFocusedField(null);
    }, []);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />

            {/* Background gradient top accent */}
            <LinearGradient
                colors={authBgGradientPrimary}
                style={formStyles.topGradient}
                pointerEvents="none"
            />

            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logoSection}>
                    <View style={formStyles.logoIcon}>
                        <Feather name="layers" size={36} color={colors.primary} />
                    </View>
                    <Text style={formStyles.appName}>GameShelf</Text>
                    <Text style={styles.tagline}>Tu biblioteca de juegos unificada</Text>
                </View>

                {/* Error */}
                {authVm.errorMessage ? (
                    <View style={formStyles.errorBanner}>
                        <Feather name="alert-circle" size={15} color={colors.error} />
                        <Text style={formStyles.errorText}>{authVm.errorMessage}</Text>
                    </View>
                ) : null}

                {/* Form */}
                <View style={styles.form}>
                    <View style={[formStyles.inputWrap, focusedField === 'email' && formStyles.inputFocused]}>
                        <Feather
                            name="mail"
                            size={18}
                            color={focusedField === 'email' ? colors.primary : colors.textTertiary}
                            style={formStyles.inputIcon}
                        />
                        <TextInput
                            style={formStyles.input}
                            placeholder="Correo electrónico"
                            placeholderTextColor={colors.textDisabled}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardAppearance="dark"
                            onFocus={() => handleFocusField('email')}
                            onBlur={handleBlurField}
                        />
                    </View>

                    <View style={[formStyles.inputWrap, focusedField === 'password' && formStyles.inputFocused]}>
                        <Feather
                            name="lock"
                            size={18}
                            color={focusedField === 'password' ? colors.primary : colors.textTertiary}
                            style={formStyles.inputIcon}
                        />
                        <TextInput
                            style={formStyles.input}
                            placeholder="Contraseña"
                            placeholderTextColor={colors.textDisabled}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            keyboardAppearance="dark"
                            onFocus={() => handleFocusField('password')}
                            onBlur={handleBlurField}
                        />
                        <TouchableOpacity
                            style={formStyles.eyeBtn}
                            onPress={handleTogglePassword}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={18}
                                color={colors.textTertiary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Forgot password */}
                    <TouchableOpacity
                        style={styles.forgotBtn}
                        onPress={handleNavigateForgotPassword}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[formStyles.primaryBtn, authVm.isLoading && formStyles.primaryBtnDisabled]}
                        onPress={handleLogin}
                        disabled={authVm.isLoading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={primaryGradientColors}
                            style={formStyles.primaryBtnGradient}
                        >
                            {authVm.isLoading ? (
                                <Text style={formStyles.primaryBtnText}>Entrando...</Text>
                            ) : (
                                <>
                                    <Text style={formStyles.primaryBtnText}>Iniciar sesión</Text>
                                    <Feather name="arrow-right" size={17} color={colors.onPrimary} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Divisor */}
                <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>o</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Continuar sin cuenta */}
                <TouchableOpacity
                    style={[formStyles.secondaryBtn, authVm.isLoading && formStyles.primaryBtnDisabled]}
                    onPress={handleContinueAsGuest}
                    disabled={authVm.isLoading}
                    activeOpacity={0.8}
                >
                    <Text style={formStyles.secondaryBtnText}>Continuar sin cuenta</Text>
                </TouchableOpacity>

                {/* Footer */}
                <TouchableOpacity style={formStyles.footerLink} onPress={handleNavigateRegister} activeOpacity={0.7}>
                    <Text style={formStyles.footerText}>¿No tienes cuenta? </Text>
                    <Text style={formStyles.footerTextBold}>Regístrate</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
});
