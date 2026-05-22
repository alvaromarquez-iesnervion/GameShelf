/**
 * Sistema de colores — Dark gaming, acento violeta + cian.
 *
 * Las claves se mantienen para no romper otros consumidores; sólo cambian valores.
 */
export const colors = {
    background: '#07080C',

    backgroundBase: '#07080C',
    backgroundGradientStops: [
        'rgba(124, 92, 255, 0.10)',  // violet haze
        'rgba(34, 211, 238, 0.06)',  // cyan haze
        'rgba(124, 92, 255, 0.03)',
        '#07080C',
    ] as const,
    /** Aura de marca para headers/secciones */
    brandAuraStops: [
        'rgba(124, 92, 255, 0.18)',
        'rgba(34, 211, 238, 0.10)',
        'transparent',
    ] as const,

    // Superficies
    surface: '#12141B',
    surfaceElevated: '#181B24',
    surfaceVariant: '#222633',
    surfacePressed: '#0E1017',

    // Acentos
    primary: '#7C5CFF',
    primaryLight: '#9D85FF',
    primaryDim: 'rgba(124, 92, 255, 0.14)',
    primaryMedium: 'rgba(124, 92, 255, 0.18)',
    primaryBorder: 'rgba(124, 92, 255, 0.45)',
    primarySubtle: 'rgba(124, 92, 255, 0.08)',
    primaryGlow: 'rgba(124, 92, 255, 0.10)',
    primaryHeroGlow: 'rgba(124, 92, 255, 0.22)',
    primaryRing: 'rgba(124, 92, 255, 0.35)',
    onPrimary: '#FFFFFF',

    secondary: '#22D3EE',
    secondaryDim: 'rgba(34, 211, 238, 0.14)',
    accent: '#22D3EE',
    accentDim: 'rgba(34, 211, 238, 0.14)',
    accentWarm: '#F472B6',

    // Texto
    textPrimary: '#F5F6FA',
    textSecondary: 'rgba(245, 246, 250, 0.66)',
    textTertiary: 'rgba(245, 246, 250, 0.42)',
    textDisabled: 'rgba(245, 246, 250, 0.22)',

    // Estados
    error: '#FF5C7A',
    errorBackground: 'rgba(255, 92, 122, 0.12)',
    errorBorder: 'rgba(255, 92, 122, 0.35)',
    success: '#34D399',
    successBackground: 'rgba(52, 211, 153, 0.12)',
    warning: '#FBBF24',
    warningBackground: 'rgba(251, 191, 36, 0.12)',

    // UI
    border: '#262A36',
    borderLight: '#333949',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderSubtleLight: 'rgba(255, 255, 255, 0.08)',
    borderWhiteThin: 'rgba(255, 255, 255, 0.10)',
    divider: '#262A36',

    overlayDark: 'rgba(0, 0, 0, 0.65)',
    overlayWhiteThin: 'rgba(255,255,255,0.18)',

    blurBackground: 'rgba(18, 20, 27, 0.82)',

    // Marcas
    steam: '#171A21',
    steamAccent: '#66C0F4',
    epic: '#0078F2',
    gog: '#86328A',
    psn: '#003791',
    psnAccent: '#0070D1',

    // ProtonDB
    protonPlatinum: '#B4D455',
    protonGold: '#FFD700',
    protonSilver: '#C0C0C0',
    protonBronze: '#CD7F32',
    protonBorked: '#FF4444',
    protonPending: '#808080',

    discount: '#34D399',
    discountBackground: 'rgba(52, 211, 153, 0.16)',

    // Inputs
    inputBackground: '#12141B',
    inputBorder: '#262A36',
    inputFocusBorder: '#7C5CFF',

    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.4)',
    overlayGradient: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,1)'],

    shadow: 'rgba(0, 0, 0, 0.55)',
    shadowLight: 'rgba(0, 0, 0, 0.25)',

    // iOS-style accents (mantenidos por compat con iconos de settings)
    iosRed: '#FF5C7A',
    iosPurple: '#7C5CFF',
    iosGreen: '#34D399',
};
