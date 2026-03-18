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
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { Feather } from '@expo/vector-icons';
import { LinkStep } from '../../components/platforms/LinkStep';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formStyles } from '../../styles/forms';

// URL ficticia que usamos como return_to en OpenID.
// No necesita existir — interceptamos la navegación antes de que cargue.
const STEAM_CALLBACK_URL = 'https://gameshelf.app/auth/steam/callback';

type SteamMode = 'webview' | 'manual';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SteamLinkModalProps {
    visible: boolean;
    isLinking: boolean;
    errorMessage: string | null;
    loginUrl: string;
    onConfirmManual: (steamInput: string) => Promise<void>;
    onConfirmOpenId: (callbackUrl: string, params: Record<string, string>) => Promise<void>;
    onClose: () => void;
}

// ─── Subcomponente local: ejemplo de formato de entrada ──────────────────────

interface ExampleProps {
    icon: keyof typeof Feather.glyphMap;
    text: string;
    label: string;
}

const Example: React.FC<ExampleProps> = ({ icon, text, label }) => (
    <View style={styles.exampleRow}>
        <Feather name={icon} size={12} color={colors.textTertiary} style={styles.exampleIcon} />
        <View style={styles.exampleContent}>
            <Text style={styles.exampleLabel}>{label}</Text>
            <Text style={styles.exampleText} numberOfLines={1}>{text}</Text>
        </View>
    </View>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

export const SteamLinkModal: React.FC<SteamLinkModalProps> = ({
    visible,
    isLinking,
    errorMessage,
    loginUrl,
    onConfirmManual,
    onConfirmOpenId,
    onClose,
}) => {
    const webViewRef = useRef<WebView>(null);
    const [mode, setMode] = useState<SteamMode>('webview');
    const [input, setInput] = useState('');
    const [showWebView, setShowWebView] = useState(false);
    const [webViewLoading, setWebViewLoading] = useState(false);
    const [hasCaptured, setHasCaptured] = useState(false);
    const [captureMessage, setCaptureMessage] = useState<string | null>(null);

    const resetState = () => {
        setInput('');
        setMode('webview');
        setShowWebView(false);
        setWebViewLoading(false);
        setHasCaptured(false);
        setCaptureMessage(null);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSwitchMode = (newMode: SteamMode) => {
        setInput('');
        setMode(newMode);
        setShowWebView(false);
        setWebViewLoading(false);
        setHasCaptured(false);
        setCaptureMessage(null);
    };

    const handleShouldStartLoad = (request: ShouldStartLoadRequest): boolean => {
        const url = request.url;
        // Interceptar el callback de Steam OpenID
        if (url.startsWith(STEAM_CALLBACK_URL) && !hasCaptured) {
            setHasCaptured(true);
            setShowWebView(false);

            // Extraer todos los parámetros openid.* de la URL de callback
            try {
                const parsed = new URL(url);
                const params: Record<string, string> = {};
                parsed.searchParams.forEach((value, key) => {
                    params[key] = value;
                });
                void onConfirmOpenId(url, params);
            } catch {
                setCaptureMessage(
                    'No se pudo leer la respuesta de Steam. Usa el método manual.',
                );
            }
            return false;
        }

        return true;
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
                {/* Header */}
                <View style={styles.modalHeader}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>Vincular Steam</Text>
                    <TouchableOpacity
                        style={styles.modalCloseBtn}
                        onPress={handleClose}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Feather name="x" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Mode tabs */}
                <View style={styles.modeSelector}>
                    <TouchableOpacity
                        style={[styles.modeTab, mode === 'webview' && styles.modeTabActive]}
                        onPress={() => handleSwitchMode('webview')}
                        activeOpacity={0.75}
                    >
                        <Feather
                            name="zap"
                            size={13}
                            color={mode === 'webview' ? colors.primary : colors.textTertiary}
                        />
                        <Text style={[styles.modeTabText, mode === 'webview' && styles.modeTabTextActive]}>
                            Inicio de sesión
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.modeTab, mode === 'manual' && styles.modeTabActive]}
                        onPress={() => handleSwitchMode('manual')}
                        activeOpacity={0.75}
                    >
                        <Feather
                            name="edit-3"
                            size={13}
                            color={mode === 'manual' ? colors.primary : colors.textTertiary}
                        />
                        <Text style={[styles.modeTabText, mode === 'manual' && styles.modeTabTextActive]}>
                            Manual
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* WebView (fullscreen when active) */}
                {mode === 'webview' && showWebView ? (
                    <View style={styles.webViewContainer}>
                        <View style={styles.webViewHeader}>
                            <TouchableOpacity
                                style={styles.backBtn}
                                onPress={() => setShowWebView(false)}
                                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            >
                                <Feather name="chevron-left" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                            <Text style={styles.webViewTitle}>Inicia sesión en Steam</Text>
                            <View style={styles.backBtn} />
                        </View>

                        <WebView
                            ref={webViewRef}
                            source={{ uri: loginUrl }}
                            onShouldStartLoadWithRequest={handleShouldStartLoad}
                            onLoadStart={() => setWebViewLoading(true)}
                            onLoadEnd={() => setWebViewLoading(false)}
                            style={styles.webView}
                            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
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
                        {mode === 'webview' ? (
                            <WebViewForm
                                isLinking={isLinking}
                                errorMessage={errorMessage}
                                captureMessage={captureMessage}
                                onOpenWebView={() => {
                                    setHasCaptured(false);
                                    setCaptureMessage(null);
                                    setShowWebView(true);
                                }}
                            />
                        ) : (
                            <ManualForm
                                input={input}
                                onChangeInput={setInput}
                                isLinking={isLinking}
                                errorMessage={errorMessage}
                                isConfirmDisabled={isConfirmDisabled}
                                onConfirm={() => onConfirmManual(input)}
                            />
                        )}
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </Modal>
    );
};

// ─── WebView form (pre-WebView instructions) ────────────────────────────────

interface WebViewFormProps {
    isLinking: boolean;
    errorMessage: string | null;
    captureMessage: string | null;
    onOpenWebView: () => void;
}

const WebViewForm: React.FC<WebViewFormProps> = ({
    isLinking,
    errorMessage,
    captureMessage,
    onOpenWebView,
}) => (
    <>
        <Text style={styles.modalInstruction}>
            Inicia sesión con tu cuenta de Steam directamente desde la app:
        </Text>

        <View style={styles.stepsBox}>
            <LinkStep number={1} text='Pulsa "Conectar con Steam" para abrir el login' />
            <LinkStep number={2} text="Introduce tu usuario y contraseña de Steam" />
            <LinkStep number={3} text="La app capturará tu SteamID automáticamente" />
        </View>

        {isLinking ? (
            <View style={styles.linkingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.linkingText}>Vinculando Steam...</Text>
            </View>
        ) : (
            <TouchableOpacity style={styles.connectBtn} onPress={onOpenWebView} activeOpacity={0.8}>
                <Feather name="log-in" size={15} color={colors.primary} />
                <Text style={styles.connectBtnText}>Conectar con Steam</Text>
            </TouchableOpacity>
        )}

        {(errorMessage ?? captureMessage) ? (
            <View style={styles.modalError}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={styles.modalErrorText}>{errorMessage ?? captureMessage}</Text>
            </View>
        ) : null}

        <Text style={styles.modalFootnote}>
            Tu contraseña se envía directamente a Steam.{'\n'}
            GameShelf nunca almacena tus credenciales.
        </Text>
    </>
);

// ─── Manual form (SteamID / URL input) ───────────────────────────────────────

interface ManualFormProps {
    input: string;
    onChangeInput: (text: string) => void;
    isLinking: boolean;
    errorMessage: string | null;
    isConfirmDisabled: boolean;
    onConfirm: () => void;
}

const ManualForm: React.FC<ManualFormProps> = ({
    input,
    onChangeInput,
    isLinking,
    errorMessage,
    isConfirmDisabled,
    onConfirm,
}) => (
    <>
        <Text style={styles.modalInstruction}>
            Introduce tu SteamID, URL de perfil o nombre de usuario:
        </Text>

        <View style={styles.stepsBox}>
            <Example icon="hash" text="76561197960287930" label="SteamID" />
            <Example icon="link" text="steamcommunity.com/id/tunombre" label="Perfil por nombre" />
            <Example icon="link" text="steamcommunity.com/profiles/76561..." label="Perfil numérico" />
        </View>

        <TextInput
            style={formStyles.modalInput}
            placeholder="Introduce tu SteamID o URL..."
            placeholderTextColor={colors.textDisabled}
            value={input}
            onChangeText={onChangeInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
            returnKeyType="done"
            onSubmitEditing={onConfirm}
        />

        {errorMessage ? (
            <View style={styles.modalError}>
                <Feather name="alert-circle" size={14} color={colors.error} />
                <Text style={styles.modalErrorText}>{errorMessage}</Text>
            </View>
        ) : null}

        <TouchableOpacity
            style={[formStyles.confirmBtn, isConfirmDisabled && formStyles.confirmBtnDisabled]}
            onPress={onConfirm}
            disabled={isConfirmDisabled}
            activeOpacity={0.8}
        >
            {isLinking ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
                <>
                    <Feather name="link" size={16} color={colors.onPrimary} />
                    <Text style={formStyles.confirmBtnText}>Vincular Steam</Text>
                </>
            )}
        </TouchableOpacity>

        <Text style={styles.modalFootnote}>
            Tu contraseña nunca se comparte con GameShelf.{'\n'}
            Solo usamos tu SteamID para leer tu biblioteca pública.
        </Text>
    </>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

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
    connectBtn: {
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
    connectBtnText: {
        ...typography.body,
        color: colors.primary,
        fontWeight: '600',
    },
    linkingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
        marginBottom: spacing.lg,
    },
    linkingText: {
        ...typography.body,
        color: colors.primary,
    },
    exampleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    exampleIcon: {
        marginRight: spacing.sm,
        width: 16,
    },
    exampleContent: {
        flex: 1,
    },
    exampleLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    exampleText: {
        ...typography.small,
        color: colors.textSecondary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
});
