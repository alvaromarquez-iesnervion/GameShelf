/**
 * Estilos de layout compartidos entre screens.
 *
 * Uso:
 *   import { sharedStyles } from '@/presentation/styles/shared';
 *   style={[sharedStyles.screenContainer, myLocalStyle]}
 *
 * Regla: solo patrones de layout que aparecen en ≥2 screens.
 * Colores, tipografía y espaciado siguen viniendo del tema directamente.
 */
import { Platform, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { layout, spacing, radius } from '../theme/spacing';
import { typography } from '../theme/typography';

export const sharedStyles = StyleSheet.create({
    // ─── Contenedores base ────────────────────────────────────────────────────

    /** Pantalla completa con fondo base */
    screenContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },

    /** ScrollView / FlatList con contenido que respeta la tab bar */
    listContent: {
        paddingBottom: layout.tabBarClearance,
    },

    // ─── Safe area con header custom ─────────────────────────────────────────

    /**
     * Padding superior para screens con header propio (sin navigation bar nativa).
     * Equivale a Platform.OS === 'ios' ? 100 : 64.
     */
    safeTop: {
        paddingTop: Platform.OS === 'ios'
            ? layout.safeAreaPaddingTop.ios
            : layout.safeAreaPaddingTop.android,
    },

    // ─── Headers de pantalla ──────────────────────────────────────────────────

    /** Header de pantalla con large title al estilo iOS */
    screenHeader: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },

    /** Título grande tipo iOS (hero) */
    largeTitle: {
        ...typography.hero,
        color: colors.textPrimary,
    },

    // ─── Secciones agrupadas ──────────────────────────────────────────────────

    /** Etiqueta de sección en mayúsculas (estilo iOS Settings) */
    sectionLabel: {
        ...typography.caption,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: spacing.sm,
        marginLeft: spacing.sm,
    },

    /** Grupo de filas con fondo surface, bordes redondeados y hairline border */
    settingsGroup: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        overflow: 'hidden',
    },

    /** Fila dentro de un settingsGroup */
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
    },

    // ─── Iconos cuadrados ──────────────────────────────────────────────────────

    /** Icono cuadrado 32x32 con radio 8 (filas de ajustes) */
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ─── Textos de pie de página ──────────────────────────────────────────────

    /** Nota al pie pequeña con lineHeight confortable */
    footnote: {
        ...typography.small,
        color: colors.textTertiary,
        marginTop: spacing.md,
        marginHorizontal: spacing.sm,
        lineHeight: 18,
    },

    // ─── Barra de búsqueda ────────────────────────────────────────────────────

    /** Contenedor de barra de búsqueda horizontal */
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
    },

    /** TextInput dentro de searchBar */
    searchInput: {
        flex: 1,
        ...typography.input,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },

    // ─── Estados vacíos ───────────────────────────────────────────────────────

    /** Contenedor centrado con margen superior para listas vacías */
    emptyContainer: {
        marginTop: 60,
    },
});
