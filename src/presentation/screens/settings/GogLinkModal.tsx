import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    StyleSheet,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { formStyles } from '../../styles/forms';
import { LinkStep } from '../../components/platforms/LinkStep';

export interface GogLinkModalProps {
    visible: boolean;
    isLinking: boolean;
    errorMessage: string | null;
    authUrl: string;
    onCodeReceived: (code: string) => Promise<void>;
    onClose: () => void;
}

export const GogLinkModal: React.FC<GogLinkModalProps> = ({
    visible,
    isLinking,
    errorMessage,
    authUrl,
    onCodeReceived,
    onClose,
}) => {
    const [showWebView, setShowWebView] = useState(false);
    const [webViewLoading, setWebViewLoading] = useState(false);

    const handleClose = () => {
        setShowWebView(false);
        onClose();
    };

    const handleGogRedirect = (url: string): boolean => {
        if (url.startsWith('https://embed.gog.com/on_login_success')) {
            const match = url.match(/[?&]code=([^&]+)/);
            if (match) {
                setShowWebView(false);
                onCodeReceived(decodeURIComponent(match[1]));
            }
            return false;
        }
        return true;
    };

    const handleShouldStartLoad = (req: ShouldStartLoadRequest): boolean =>
        handleGogRedirect(req.url);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="formSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.handle} />
                    {showWebView ? (
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => setShowWebView(false)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Feather name="chevron-left" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.backBtn} />
                    )}
                    <Text style={styles.title}>Vincular GOG</Text>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={handleClose}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                        <Feather name="x" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {showWebView ? (
                    <View style={styles.webViewContainer}>
                        <WebView
                            source={{ uri: authUrl }}
                            onShouldStartLoadWithRequest={handleShouldStartLoad}
                            onNavigationStateChange={(state) => handleGogRedirect(state.url)}
                            onLoadStart={() => setWebViewLoading(true)}
                            onLoadEnd={() => setWebViewLoading(false)}
                            style={styles.webView}
                        />
                        {webViewLoading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        )}
                    </View>
                ) : (
                    /* Body */
                    <View style={styles.body}>
                        <Text style={styles.instruction}>
                            Conecta tu cuenta de GOG para sincronizar tu biblioteca:
                        </Text>

                        <View style={styles.stepsBox}>
                            <LinkStep number={1} text='Pulsa "Conectar con GOG"' />
                            <LinkStep number={2} text="Inicia sesión en GOG en la ventana que se abre" />
                            <LinkStep number={3} text="La app detecta el inicio de sesión automáticamente" />
                        </View>

                        {errorMessage ? (
                            <View style={styles.errorBox}>
                                <Feather name="alert-circle" size={14} color={colors.error} />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[formStyles.confirmBtn, isLinking && formStyles.confirmBtnDisabled]}
                            onPress={() => setShowWebView(true)}
                            disabled={isLinking}
                            activeOpacity={0.8}
                        >
                            {isLinking ? (
                                <ActivityIndicator size="small" color={colors.onPrimary} />
                            ) : (
                                <>
                                    <Feather name="link" size={16} color={colors.onPrimary} />
                                    <Text style={formStyles.confirmBtnText}>Conectar con GOG</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.footnote}>
                            Usa la API no oficial de GOG (la misma que Heroic y Playnite).{'\n'}
                            Puede cambiar sin previo aviso.
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
    },
    handle: {
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
    backBtn: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...typography.subheading,
        flex: 1,
        textAlign: 'center',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    instruction: {
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
    errorBox: {
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
    errorText: {
        ...typography.small,
        color: colors.error,
        flex: 1,
        lineHeight: 18,
    },
    footnote: {
        ...typography.small,
        color: colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
        marginTop: spacing.md,
    },
    webViewContainer: {
        flex: 1,
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
});
