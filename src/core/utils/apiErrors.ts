import { getErrorMessage } from './errorUtils';

const API_ERROR_CODE_MAP: Record<string, string> = {
    'BAD_REQUEST': 'Solicitud incorrecta',
    'UNAUTHORIZED': 'No autorizado',
    'FORBIDDEN': 'Acceso denegado',
    'NOT_FOUND': 'Recurso no encontrado',
    'CONFLICT': 'Conflicto con el estado actual',
    'RATE_LIMITED': 'Demasiados intentos. Intenta de nuevo más tarde',
    'RATE_LIMITER_UNAVAILABLE': 'Servicio de límites temporalmente no disponible',
    'EXTERNAL_SERVICE_ERROR': 'Error del servicio externo',
    'ACCOUNT_DELETION_ERROR': 'Error al eliminar la cuenta',
    'SETTINGS_ERROR': 'Error en la configuración',
    'INTERNAL_ERROR': 'Error interno del servidor',
};

const DYNAMIC_MESSAGE_PATTERNS: { regex: RegExp; translation: string }[] = [
    { regex: /Game\s*'[^']+'\s*is already in the wishlist/i, translation: 'El juego ya está en tu lista de deseos' },
    { regex: /Platform\s*'[^']+'\s*is already linked to this account/i, translation: 'La plataforma \'{{platform}}\' ya está vinculada a esta cuenta' },
    { regex: /Steam OpenID verification failed/i, translation: 'Verificación de Steam OpenID fallida' },
];

export function mapApiError(code: string, message: string): string {
    const staticMessage = API_ERROR_CODE_MAP[code];
    if (staticMessage) return staticMessage;

    for (const pattern of DYNAMIC_MESSAGE_PATTERNS) {
        if (pattern.regex.test(message)) {
            let translation = pattern.translation;
            const platformMatch = message.match(/Platform\s*'([^']+)'/i);
            if (translation.includes('{{platform}}') && platformMatch) {
                translation = translation.replace('{{platform}}', platformMatch[1]);
            }
            return translation;
        }
    }

    return getErrorMessage(message);
}
