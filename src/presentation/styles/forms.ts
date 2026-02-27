/**
 * Estilos de formularios compartidos entre screens de auth y modales.
 *
 * Uso:
 *   import { formStyles } from '@/presentation/styles/forms';
 *   style={[formStyles.inputWrap, isFocused && formStyles.inputFocused]}
 *
 * Regla: solo patrones que aparecen en ≥2 screens/componentes.
 */
import { Platform, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export const formStyles = StyleSheet.create({
    // ─── Inputs ───────────────────────────────────────────────────────────────

    /** Contenedor de un campo con icono a la izquierda, altura estándar 52 */
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        height: 52,
    },

    /** Override de borde cuando el campo tiene el foco */
    inputFocused: {
        borderColor: colors.inputFocusBorder,
    },

    /** Icono a la izquierda del input */
    inputIcon: {
        paddingLeft: spacing.lg,
        paddingRight: spacing.xs,
    },

    /** El TextInput propiamente dicho dentro del inputWrap */
    input: {
        flex: 1,
        ...typography.input,
        color: colors.textPrimary,
        paddingVertical: 0,
        paddingRight: spacing.md,
    },

    /** Botón de ojo para campos de contraseña */
    eyeBtn: {
        paddingRight: spacing.lg,
        paddingLeft: spacing.sm,
    },

    // ─── Botón primario con gradiente ─────────────────────────────────────────

    /** Contenedor TouchableOpacity del botón primario */
    primaryBtn: {
        marginTop: spacing.sm,
        borderRadius: radius.md,
        overflow: 'hidden',
    },

    /** Opacidad del botón primario cuando está deshabilitado */
    primaryBtnDisabled: {
        opacity: 0.55,
    },

    /** Relleno del LinearGradient interior, altura estándar 52 */
    primaryBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        gap: spacing.sm,
    },

    /** Texto dentro del botón primario */
    primaryBtnText: {
        ...typography.button,
        color: colors.onPrimary,
    },

    // ─── Botón secundario (outline) ───────────────────────────────────────────

    /** Botón con borde y fondo surface */
    secondaryBtn: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },

    /** Texto del botón secundario */
    secondaryBtnText: {
        ...typography.button,
        color: colors.textPrimary,
    },

    // ─── Banner de error inline ───────────────────────────────────────────────

    /** Contenedor del banner de error (debajo del formulario) */
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.errorBackground,
        borderWidth: 1,
        borderColor: colors.errorBorder,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },

    /** Texto dentro del banner de error */
    errorText: {
        ...typography.small,
        color: colors.error,
        flex: 1,
    },

    // ─── Footer de navegación (¿ya tienes cuenta? / ¿No tienes cuenta?) ───────

    /** Fila de footer con dos Text */
    footerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xxl,
    },

    /** Texto plano del footer */
    footerText: {
        ...typography.bodySecondary,
        color: colors.textSecondary,
    },

    /** Texto destacado del footer (acción) */
    footerTextBold: {
        ...typography.bodySecondary,
        fontWeight: '600',
        color: colors.primary,
    },

    // ─── Gradiente decorativo de fondo (pantallas de auth) ───────────────────

    /** Franja de color en la parte superior de la pantalla */
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
    },

    // ─── Logo / ícono de aplicación ───────────────────────────────────────────

    /** Icono cuadrado de la app en la pantalla de login */
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

    /** Nombre de la app debajo del logo */
    appName: {
        ...typography.hero,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },

    // ─── Input de modal (sin icono izquierdo, padding interno) ───────────────

    /** Campo de texto dentro de un Modal, estilo plano */
    modalInput: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        color: colors.textPrimary,
        ...typography.input,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
    },

    /** Botón de confirmación de modal (fondo primary, sin gradiente) */
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        height: 52,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },

    confirmBtnDisabled: {
        opacity: 0.45,
    },

    confirmBtnText: {
        ...typography.button,
        color: colors.onPrimary,
    },

    // ─── Gradientes de colores para botones de auth (array para LinearGradient) ─
    // No son StyleSheet entries — se exportan como constantes separadas.
});

/** Array de colores del gradiente del botón primario (color primary). */
export const primaryGradientColors: [string, string] = [
    colors.primaryLight,
    colors.primary,
];

/** Array de colores del gradiente del botón secundario (color secondary/indigo). */
export const secondaryGradientColors: [string, string] = [
    '#6B69F0',
    colors.secondary,
];

/** Array de colores del gradiente de fondo primary (auth screens). */
export const authBgGradientPrimary: [string, string] = [
    'rgba(10, 132, 255, 0.12)',
    'transparent',
];

/** Array de colores del gradiente de fondo secondary (Register screen). */
export const authBgGradientSecondary: [string, string] = [
    'rgba(94, 92, 230, 0.1)',
    'transparent',
];
