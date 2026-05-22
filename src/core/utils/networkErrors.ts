import { getErrorMessage } from './errorUtils';

export function mapNetworkError(error: unknown): string {
    const message = getErrorMessage(error);
    if (message.includes('fetch') || message.includes('Network request failed') || message.includes('Network is unreachable')) {
        return 'Sin conexión a internet';
    }
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        return 'La solicitud tardó demasiado. Comprueba tu conexión e inténtalo de nuevo';
    }
    return getErrorMessage(error);
}
