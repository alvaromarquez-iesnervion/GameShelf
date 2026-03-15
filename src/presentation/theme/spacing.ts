/**
 * Sistema de espaciado — múltiplos de 4px
 */
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

/**
 * Constantes de layout compartidas entre screens
 */
export const layout = {
    /** Clearance inferior para la tab bar nativa */
    tabBarClearance: 100,
    /** Padding superior para screens con header custom (sin navigation bar nativa) */
    safeAreaPaddingTop: { ios: 110, android: 64 },
    /** Padding superior para modales y screens de auth con back button flotante */
    authHeaderTop: { ios: 60, android: 24 },
};

/**
 * Bordes redondeados
 */
export const radius = {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    full: 9999,
};

/**
 * Sombras
 */
export const shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    /** Glow suave para cards con imagen — sutil en OLED */
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
};

/**
 * Text shadows reutilizables para texto sobre imágenes
 */
export const textShadows = {
    /** Sombra estándar para títulos sobre gradient de imagen */
    onImage: {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    /** Sombra más suave para subtítulos sobre gradient */
    onImageLight: {
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
} as const;

/**
 * Configuración de spring compartida para animaciones de press en cards.
 * Damping bajo + stiffness alto = animación snappy tipo iOS App Store.
 */
export const springPresets = {
    /** Press animation para game cards (scale down ~0.94-0.97) */
    cardPress: { damping: 15, stiffness: 450, mass: 0.3 },
} as const;