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
import { styles } from './ForgotPasswordScreen.styles';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const navigation = useNavigation<Nav>();

    const [email, setEmail] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    const handleReset = useCallback(async () => {
        if (!email.trim()) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const success = await authVm.resetPassword(email.trim());
        if (success) {
            setEmailSent(true);
        }
    }, [email, authVm]);

    const handleBack = useCallback(() => {
        authVm.clearError();
        navigation.goBack();
    }, [authVm, navigation]);

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
                            style={[formStyles.secondaryBtn, { marginTop: 32 }]}
                            onPress={handleBack}
                            activeOpacity={0.8}
                        >
                            <Text style={formStyles.secondaryBtnText}>Volver al inicio de sesión</Text>
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
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </View>

                            <TouchableOpacity
                                style={[formStyles.primaryBtn, (authVm.isLoading || !email.trim()) && formStyles.primaryBtnDisabled]}
                                onPress={handleReset}
                                disabled={authVm.isLoading || !email.trim()}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={primaryGradientColors}
                                    style={formStyles.primaryBtnGradient}
                                >
                                    {authVm.isLoading ? (
                                        <Text style={formStyles.primaryBtnText}>Enviando...</Text>
                                    ) : (
                                        <>
                                            <Text style={formStyles.primaryBtnText}>Enviar enlace</Text>
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
