import { TextStyle, Platform } from 'react-native';
import { colors } from './colors';

// Usar San Francisco en iOS para sensación nativa, Roboto en otros
const sansFont = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const typography = {
    hero: {
        fontFamily: sansFont,
        fontSize: 34,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: 0.37,
    } as TextStyle,

    heading: {
        fontFamily: sansFont,
        fontSize: 28,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: 0.35,
    } as TextStyle,

    subheading: {
        fontFamily: sansFont,
        fontSize: 22,
        fontWeight: '600',
        color: colors.textPrimary,
        letterSpacing: 0.35,
    } as TextStyle,

    title: {
        fontFamily: sansFont,
        fontSize: 20,
        fontWeight: '600',
        color: colors.textPrimary,
        letterSpacing: 0.38,
    } as TextStyle,

    body: {
        fontFamily: sansFont,
        fontSize: 17,
        fontWeight: '400',
        color: colors.textPrimary,
        lineHeight: 22,
        letterSpacing: -0.41,
    } as TextStyle,

    bodySecondary: {
        fontFamily: sansFont,
        fontSize: 15,
        fontWeight: '400',
        color: colors.textSecondary,
        lineHeight: 20,
        letterSpacing: -0.24,
    } as TextStyle,

    caption: {
        fontFamily: sansFont,
        fontSize: 13,
        fontWeight: '500',
        color: colors.textTertiary,
        letterSpacing: -0.08,
    } as TextStyle,

    small: {
        fontFamily: sansFont,
        fontSize: 12,
        fontWeight: '400',
        color: colors.textTertiary,
    } as TextStyle,

    button: {
        fontFamily: sansFont,
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: -0.41,
    } as TextStyle,

    buttonSmall: {
        fontFamily: sansFont,
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: -0.15,
    } as TextStyle,

    label: {
        fontFamily: sansFont,
        fontSize: 13,
        fontWeight: '600',
        color: colors.textTertiary,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.06,
    } as TextStyle,

    price: {
        fontFamily: sansFont,
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    } as TextStyle,

    priceSmall: {
        fontFamily: sansFont,
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    } as TextStyle,

    /** Texto de campo de entrada (TextInput). Usa siempre la fuente nativa. */
    input: {
        fontFamily: sansFont,
        fontSize: 16,
        fontWeight: '400',
        color: colors.textPrimary,
    } as TextStyle,
};
