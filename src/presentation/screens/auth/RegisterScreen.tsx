import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
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
import { formStyles, authBgGradientSecondary, secondaryGradientColors } from '../../styles/forms';
import { styles } from './RegisterScreen.styles';

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

    const handleRegister = useCallback(async () => {
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
    }, [email, password, confirmPassword, authVm]);

    const handleGoBack = useCallback(() => {
        Haptics.selectionAsync();
        authVm.clearError();
        navigation.goBack();
    }, [authVm, navigation]);

    const handleTogglePassword = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    const handleToggleConfirmPassword = useCallback(() => {
        setShowConfirmPassword(prev => !prev);
    }, []);

    const handleFocusField = useCallback((field: string) => {
        setFocusedField(field);
    }, []);

    const handleBlurField = useCallback(() => {
        setFocusedField(null);
    }, []);

    const displayError = localError ?? authVm.errorMessage;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={authBgGradientSecondary}
                style={formStyles.topGradient}
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
                    <View style={formStyles.errorBanner}>
                        <Feather name="alert-circle" size={15} color={colors.error} />
                        <Text style={formStyles.errorText}>{displayError}</Text>
                    </View>
                ) : null}

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
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
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
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                        />
                        <TouchableOpacity
                            style={formStyles.eyeBtn}
                            onPress={() => setShowPassword(!showPassword)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[formStyles.inputWrap, focusedField === 'confirm' && formStyles.inputFocused]}>
                        <Feather
                            name="lock"
                            size={18}
                            color={focusedField === 'confirm' ? colors.primary : colors.textTertiary}
                            style={formStyles.inputIcon}
                        />
                        <TextInput
                            style={formStyles.input}
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
                            style={formStyles.eyeBtn}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[formStyles.primaryBtn, authVm.isLoading && formStyles.primaryBtnDisabled]}
                        onPress={handleRegister}
                        disabled={authVm.isLoading}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={secondaryGradientColors}
                            style={formStyles.primaryBtnGradient}
                        >
                            {authVm.isLoading ? (
                                <Text style={formStyles.primaryBtnText}>Registrando...</Text>
                            ) : (
                                <>
                                    <Text style={formStyles.primaryBtnText}>Crear cuenta</Text>
                                    <Feather name="user-plus" size={17} color={colors.onPrimary} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={formStyles.footerLink} onPress={handleGoBack} activeOpacity={0.7}>
                    <Text style={formStyles.footerText}>¿Ya tienes cuenta? </Text>
                    <Text style={formStyles.footerTextBold}>Inicia sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
});
