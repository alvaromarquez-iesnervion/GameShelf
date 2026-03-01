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
};