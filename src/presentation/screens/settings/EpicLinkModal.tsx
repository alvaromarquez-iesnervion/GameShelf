import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { Feather } from '@expo/vector-icons';
import { LinkStep } from '../../components/platforms/LinkStep';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formStyles } from '../../styles/forms';

type EpicMode = 'authcode' | 'gdpr';

export interface EpicLinkModalProps {
    visible: boolean;
    isLinking: boolean;
    errorMessage: string | null;
    loginUrl: string;
    onConfirmAuthCode: (code: string) => Promise<void>;
    onConfirmGdpr: (json: string) => Promise<void>;
    onOpenBrowser: () => void;
    onClose: () => void;
}

const EPIC_AUTH_CAPTURE_SCRIPT = `
(() => {
    if (window.__epicCaptureActive) return;
    window.__epicCaptureActive = true;

    const post = (payload) => {
        if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
    };

    let captured = false;
    let fetchStarted = false;

    const sendCode = (code) => {
        if (captured) return;
        captured = true;
        post({ type: 'authCode', code });
    };

    const readText = () => {
        // Intentar múltiples formas de leer el contenido de la página
        const pre = document.querySelector('pre');
        if (pre && pre.textContent && pre.textContent.trim()) return pre.textContent.trim();

        const bodyText = document.body?.innerText?.trim();
        if (bodyText) return bodyText;

        const bodyTextContent = document.body?.textContent?.trim();
        if (bodyTextContent) return bodyTextContent;

        return '';
    };

    const tryExtractCode = (text) => {
        if (!text) return false;

        // 1. Parsear como JSON
        try {
            const data = JSON.parse(text);
            if (typeof data.authorizationCode === 'string' && data.authorizationCode.length > 0) {
                sendCode(data.authorizationCode);
                return true;
            }
            // Extraer code del redirectUrl si existe
            if (typeof data.redirectUrl === 'string') {
                const m = data.redirectUrl.match(/[?&]code=([^&]+)/);
                if (m && m[1]) {
                    sendCode(decodeURIComponent(m[1]));
                    return true;
                }
            }
            if (data.authorizationCode === null) {
                return false;
            }
        } catch {}

        // 2. Regex fallback
        const match = text.match(/"authorizationCode"\\s*:\\s*"([^"]+)"/);
        if (match && match[1]) {
            sendCode(match[1]);
            return true;
        }

        return false;
    };

    const parseAuthCode = () => {
        if (captured) return;
        const href = window.location.href || '';

        // 1. Buscar ?code= en la URL actual
        const urlMatch = href.match(/[?&]code=([^&]+)/);
        if (urlMatch && urlMatch[1]) {
            sendCode(decodeURIComponent(urlMatch[1]));
            return;
        }

        // 2. Leer el body
        const text = readText();

        // 3. Intentar extraer el código del texto
        if (text && tryExtractCode(text)) return;

        // 4. Notificar al handler de React sobre el estado de la página
        post({ type: 'pageMeta', url: href, hasText: Boolean(text) });

        // 5. Si estamos en la página de redirect y no hay texto visible,
        //    intentar fetch() desde esta misma página (con las cookies de sesión).
        //    Solo un intento — fetchStarted evita que setInterval lance más.
        if (href.includes('/id/api/redirect') && !text && !fetchStarted) {
            fetchStarted = true;
            fetch(href, { credentials: 'include' })
                .then(function(r) { return r.text(); })
                .then(function(body) {
                    if (captured) return;
                    if (!tryExtractCode(body)) {
                        post({ type: 'authCodeMissing' });
                    }
                })
                .catch(function() {
                    if (!captured) post({ type: 'authCodeMissing' });
                });
        }
    };

    parseAuthCode();
    document.addEventListener('readystatechange', parseAuthCode);
    window.addEventListener('load', parseAuthCode);
    window.setInterval(parseAuthCode, 600);
})();
true;
`;

export const EpicLinkModal: React.FC<EpicLinkModalProps> = ({
    visible,
    isLinking,
    errorMessage,
    loginUrl,
    onConfirmAuthCode,
    onConfirmGdpr,
    onOpenBrowser,
    onClose,
}) => {
    const webViewRef = useRef<WebView>(null);
    const [mode, setMode] = useState<EpicMode>('authcode');
    const [input, setInput] = useState('');
    const [showWebView, setShowWebView] = useState(false);
    const [webViewLoading, setWebViewLoading] = useState(false);
    const [hasCapturedCode, setHasCapturedCode] = useState(false);
    const [captureMessage, setCaptureMessage] = useState<string | null>(null);
    const [webViewUrl, setWebViewUrl] = useState(loginUrl);

    const resetState = () => {
        setInput('');
        setMode('authcode');
        setShowWebView(false);
        setWebViewLoading(false);
        setHasCapturedCode(false);
        setCaptureMessage(null);
        setWebViewUrl(loginUrl);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSwitchMode = (newMode: EpicMode) => {
        setInput('');
        setMode(newMode);
        setShowWebView(false);
        setWebViewLoading(false);
        setHasCapturedCode(false);
        setCaptureMessage(null);
    };

    const handleConfirm = async () => {
        if (mode === 'authcode') {
            await onConfirmAuthCode(input);
        } else {
            await onConfirmGdpr(input);
        }
    };

    const handleEpicWebMessage = (event: WebViewMessageEvent) => {
        let payload: Record<string, unknown>;
        try {
            payload = JSON.parse(event.nativeEvent.data);
        } catch {
            return;
        }

        if (payload.type === 'authCode' && typeof payload.code === 'string' && !hasCapturedCode) {
            setHasCapturedCode(true);
            setInput(payload.code);
            setShowWebView(false);
            setCaptureMessage(null);
            void onConfirmAuthCode(payload.code);
            return;
        }

        if (payload.type === 'authCodeMissing') {
            if (!hasCapturedCode) {
                setShowWebView(false);
                setCaptureMessage(
                    'Epic no devolvió el código automáticamente. Puedes reintentarlo o usar el navegador y pegar el código manualmente.',
                );
            }
            return;
        }

        if (payload.type === 'pageMeta') {
            const pageUrl = typeof payload.url === 'string' ? payload.url : '';
            if (pageUrl.includes('/id/api/redirect') && !payload.hasText && !hasCapturedCode) {
                setCaptureMessage(
                    'Epic completó el login, pero no hemos podido leer el código todavía. Si no avanza, usa el flujo manual del navegador.',
                );
            }
        }
    };

    const handleShouldStartLoad = (request: ShouldStartLoadRequest): boolean => {
        if (request.url.startsWith('about:srcdoc')) {
            return false;
        }

        const url = request.url;

        // Interceptar custom scheme redirects de Epic (com.epicgames.launcher://...?code=xxx)
        // El WebView no puede navegar a custom schemes — se quedaría en pantalla blanca.
        if (
            !url.startsWith('http://') &&
            !url.startsWith('https://') &&
            !url.startsWith('about:')
        ) {
            const codeMatch = url.match(/[?&]code=([^&]+)/);
            if (codeMatch?.[1] && !hasCapturedCode) {
                setHasCapturedCode(true);
                const code = decodeURIComponent(codeMatch[1]);
                setInput(code);
                setShowWebView(false);
                setCaptureMessage(null);
                void onConfirmAuthCode(code);
            }
            return false; // Bloquear navegación a custom schemes
        }

        return true;
    };

    const handleOpenWindow = (targetUrl: string) => {
        if (!targetUrl || targetUrl.startsWith('about:srcdoc')) {
            return;
        }

        setWebViewUrl(targetUrl);
        webViewRef.current?.stopLoading();
    };

    const requestEpicCodeCapture = () => {
        webViewRef.current?.injectJavaScript(EPIC_AUTH_CAPTURE_SCRIPT);
    };

    const isConfirmDisabled = !input.trim() || isLinking;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="formSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modalHeader}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Vincular Epic Games</Text>
                    <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={handleClose}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Feather name="x" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modeSelector}>
                    <TouchableOpacity
                        style={[styles.modeTab, mode === 'authcode' && styles.modeTabActive]}
                        onPress={() => handleSwitchMode('authcode')}
                        activeOpacity={0.75}
                    >
                        <Feather
                            name="zap"
                            size={13}
                            color={mode === 'authcode' ? colors.primary : colors.textTertiary}
                        />
                        <Text style={[styles.modeTabText, mode === 'authcode' && styles.modeTabTextActive]}>
                            Inicio de sesión
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeTab, mode === 'gdpr' && styles.modeTabActive]}
                        onPress={() => handleSwitchMode('gdpr')}
                        activeOpacity={0.75}
                    >
                        <Feather
                            name="file-text"
                            size={13}
                            color={mode === 'gdpr' ? colors.primary : colors.textTertiary}
                        />
                        <Text style={[styles.modeTabText, mode === 'gdpr' && styles.modeTabTextActive]}>
                            Importar JSON
                        </Text>
                    </TouchableOpacity>
                </View>

                {mode === 'authcode' && showWebView ? (
                    <View style={styles.webViewContainer}>
                        <View style={styles.webViewHeader}>
                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={() => setShowWebView(false)}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Feather name="chevron-left" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <Text style={styles.webViewTitle}>Inicia sesión en Epic</Text>
                            <View style={styles.backBtn} />
                        </View>

                        <WebView
                            ref={webViewRef}
                            source={{ uri: webViewUrl }}
                            onMessage={handleEpicWebMessage}
                            onShouldStartLoadWithRequest={handleShouldStartLoad}
                            onOpenWindow={(event) => handleOpenWindow(event.nativeEvent.targetUrl)}
                            onNavigationStateChange={(navState) => {
                                // Si la URL de navegación contiene ?code=, capturarlo directamente
                                if (navState.url && !hasCapturedCode) {
                                    const codeMatch = navState.url.match(/[?&]code=([^&]+)/);
                                    if (codeMatch?.[1]) {
                                        const code = decodeURIComponent(codeMatch[1]);
                                        setHasCapturedCode(true);
                                        setInput(code);
                                        setShowWebView(false);
                                        setCaptureMessage(null);
                                        void onConfirmAuthCode(code);
                                        return;
                                    }
                                }
                                requestEpicCodeCapture();
                            }}
                            injectedJavaScript={EPIC_AUTH_CAPTURE_SCRIPT}
                            injectedJavaScriptBeforeContentLoaded={EPIC_AUTH_CAPTURE_SCRIPT}
                            onLoadStart={() => setWebViewLoading(true)}
                            onLoadEnd={() => {
                                setWebViewLoading(false);
                                requestEpicCodeCapture();
                            }}
                            style={styles.webView}
                            incognito={true}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            setSupportMultipleWindows={false}
                            sharedCookiesEnabled={true}
                            thirdPartyCookiesEnabled={true}
                        />

                        {webViewLoading ? (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : null}
                    </View>
                ) : (
                    <ScrollView
                        style={styles.modalBody}
                        contentContainerStyle={styles.modalBodyContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {mode === 'authcode' ? (
                            <AuthCodeForm
                                input={input}
                                onChangeInput={setInput}
                                isLinking={isLinking}
                                errorMessage={errorMessage}
                                captureMessage={captureMessage}
                                isConfirmDisabled={isConfirmDisabled}
                                onOpenAutoLogin={() => {
                                    setHasCapturedCode(false);
                                    setCaptureMessage(null);
                                    setWebViewUrl(loginUrl);
                                    setShowWebView(true);
                                }}
                                onOpenBrowser={onOpenBrowser}
                                onConfirm={handleConfirm}
                            />
                        ) : (
                            <GdprForm
                                input={input}
                                onChangeInput={setInput}
                                isLinking={isLinking}
                                errorMessage={errorMessage}
                                isConfirmDisabled={isConfirmDisabled}
                                onConfirm={handleConfirm}
                            />
                        )}
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </Modal>
    );
};

interface AuthCodeFormProps {
    input: string;
    onChangeInput: (text: string) => void;
    isLinking: boolean;
    errorMessage: string | null;
    captureMessage: string | null;
    isConfirmDisabled: boolean;
    onOpenAutoLogin: () => void;
    onOpenBrowser: () => void;
    onConfirm: () => void;
}

const AuthCodeForm: React.FC<AuthCodeFormProps> = ({
    input,
    onChangeInput,
    isLinking,
    errorMessage,
    captureMessage,
    isConfirmDisabled,
    onOpenAutoLogin,
    onOpenBrowser,
    onConfirm,
}) => (
    <>
        <Text style={styles.modalInstruction}>
            Conecta Epic Games y deja que la app capture el código automáticamente:
        </Text>

        <View style={styles.stepsBox}>
            <LinkStep number={1} text='Pulsa "Conectar con Epic" e inicia sesión en la ventana integrada' />
            <LinkStep number={2} text='Cuando Epic devuelva el JSON final, la app leerá "authorizationCode" por ti' />
            <LinkStep number={3} text='Si algo falla, puedes abrir el navegador y pegar el código manualmente' />
        </View>

        <TouchableOpacity style={styles.openBrowserBtn} onPress={onOpenAutoLogin} activeOpacity={0.8}>
            <Feather name="link" size={15} color={colors.primary} />
            <Text style={styles.openBrowserText}>Conectar con Epic Games</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.openBrowserBtn, styles.openBrowserBtnSecondary]}
            onPress={onOpenBrowser}
            activeOpacity={0.8}
        >
            <Feather name="external-link" size={15} color={colors.textSecondary} />
            <Text style={[styles.openBrowserText, styles.openBrowserTextSecondary]}>
                Abrir flujo manual en navegador
            </Text>
        </TouchableOpacity>

        <Text style={styles.modalLabel}>Pega el valor de &quot;authorizationCode&quot; aquí:</Text>
        <TextInput
            style={formStyles.modalInput}
            placeholder="Ej: a1b2c3d4e5f6..."
            placeholderTextColor={colors.textDisabled}
            value={input}
            onChangeText={onChangeInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
            returnKeyType="done"
            onSubmitEditing={onConfirm}
        />

        <ModalError message={errorMessage ?? captureMessage} />

        <ConfirmButton
            isDisabled={isConfirmDisabled}
            isLinking={isLinking}
            onPress={onConfirm}
            label="Vincular Epic Games"
        />

        <Text style={styles.modalFootnote}>
            El código caduca en ~5 minutos.{'\n'}
            Usa una API interna de Epic y la captura automática puede dejar de funcionar si Epic cambia este flujo.
        </Text>
    </>
);

interface GdprFormProps {
    input: string;
    onChangeInput: (text: string) => void;
    isLinking: boolean;
    errorMessage: string | null;
    isConfirmDisabled: boolean;
    onConfirm: () => void;
}

const GdprForm: React.FC<GdprFormProps> = ({
    input,
    onChangeInput,
    isLinking,
    errorMessage,
    isConfirmDisabled,
    onConfirm,
}) => (
    <>
        <Text style={styles.modalInstruction}>
            Descarga tu biblioteca de Epic manualmente:
        </Text>

        <View style={styles.stepsBox}>
            <LinkStep number={1} text="Ve a epicgames.com/account/privacy" />
            <LinkStep number={2} text="Haz clic en 'Descargar tus datos personales'" />
            <LinkStep number={3} text="Espera 24-48 horas y descarga el ZIP" />
            <LinkStep number={4} text="Abre 'entitlementGrantByEntitlementName.json' y cópialo" />
        </View>

        <Text style={styles.modalLabel}>Pega el contenido del JSON aquí:</Text>
        <TextInput
            style={styles.epicModalInput}
            placeholder="Pega el contenido JSON..."
            placeholderTextColor={colors.textDisabled}
            value={input}
            onChangeText={onChangeInput}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
        />

        <ModalError message={errorMessage} />

        <ConfirmButton
            isDisabled={isConfirmDisabled}
            isLinking={isLinking}
            onPress={onConfirm}
            label="Vincular Epic Games"
        />

        <Text style={styles.modalFootnote}>
            Tu JSON nunca se comparte con servidores externos.{'\n'}
            Solo se procesa localmente en tu dispositivo.
        </Text>
    </>
);

const ModalError: React.FC<{ message: string | null }> = ({ message }) =>
    message ? (
        <View style={styles.modalError}>
            <Feather name="alert-circle" size={14} color={colors.error} />
            <Text style={styles.modalErrorText}>{message}</Text>
        </View>
    ) : null;

interface ConfirmButtonProps {
    isDisabled: boolean;
    isLinking: boolean;
    onPress: () => void;
    label: string;
}

const ConfirmButton: React.FC<ConfirmButtonProps> = ({ isDisabled, isLinking, onPress, label }) => (
    <TouchableOpacity
        style={[formStyles.confirmBtn, isDisabled && formStyles.confirmBtnDisabled]}
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
    >
        {isLinking ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
            <>
                <Feather name="link" size={16} color={colors.onPrimary} />
                <Text style={formStyles.confirmBtnText}>{label}</Text>
            </>
        )}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.border,
        position: 'absolute',
        top: 8,
        alignSelf: 'center',
        left: '50%',
        marginLeft: -18,
    },
    modalTitle: {
        ...typography.subheading,
        flex: 1,
        textAlign: 'center',
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modeSelector: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    modeTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
    },
    modeTabActive: {
        backgroundColor: colors.background,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    modeTabText: {
        ...typography.small,
        color: colors.textTertiary,
        fontWeight: '500',
    },
    modeTabTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    modalBody: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    modalBodyContent: {
        paddingBottom: spacing.xxl,
    },
    webViewContainer: {
        flex: 1,
    },
    webViewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    webViewTitle: {
        ...typography.body,
        flex: 1,
        textAlign: 'center',
        color: colors.textSecondary,
    },
    webView: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    modalInstruction: {
        ...typography.body,
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    stepsBox: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        gap: spacing.sm,
    },
    openBrowserBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    openBrowserText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
    openBrowserBtnSecondary: {
        borderColor: colors.border,
        marginTop: spacing.sm,
    },
    openBrowserTextSecondary: {
        color: colors.textSecondary,
        fontWeight: '500',
    },
    modalLabel: {
        ...typography.small,
        color: colors.textTertiary,
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
        marginBottom: spacing.xs,
    },
    modalError: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.errorBackground,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    modalErrorText: {
        ...typography.small,
        color: colors.error,
        flex: 1,
        lineHeight: 18,
    },
    modalFootnote: {
        ...typography.small,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
    },
    epicModalInput: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.textPrimary,
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
        height: 200,
    },
});
