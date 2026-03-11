import { AxiosInstance, AxiosError } from 'axios';

/** Status codes que merecen un reintento (errores transitorios del servidor). */
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const MAX_DELAY_MS = 30_000;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function backoffMs(attempt: number, retryAfterHeader?: string | null): number {
    if (retryAfterHeader) {
        const parsed = parseInt(retryAfterHeader, 10);
        if (!Number.isNaN(parsed)) return Math.min(parsed * 1000, MAX_DELAY_MS);
    }
    return Math.min(1_000 * 2 ** attempt, MAX_DELAY_MS);
}

/**
 * Añade retry con backoff exponencial a una instancia de axios.
 * Reintenta en errores de red y en status 429 / 502 / 503 / 504.
 * No reintenta errores de cliente (4xx salvo 429).
 */
export function addAxiosRetryInterceptor(
    instance: AxiosInstance,
    maxRetries = 3,
): void {
    instance.interceptors.response.use(
        response => response,
        async (error: AxiosError) => {
            const config = error.config as typeof error.config & { _retryCount?: number };
            if (!config) return Promise.reject(error);

            const status = error.response?.status ?? 0;
            const isRetryable = !error.response || RETRYABLE_STATUSES.has(status);

            config._retryCount = config._retryCount ?? 0;
            if (!isRetryable || config._retryCount >= maxRetries) {
                return Promise.reject(error);
            }

            config._retryCount += 1;
            const retryAfter = error.response?.headers?.['retry-after'] as string | undefined;
            await sleep(backoffMs(config._retryCount - 1, retryAfter));
            return instance(config);
        },
    );
}

/**
 * Envuelve una función fetch con retry para errores de red y status 429/502/503/504.
 * El caller sigue siendo responsable de manejar 401/403 (renovación de token).
 */
export async function fetchWithRetry(
    fetchFn: () => Promise<Response>,
    maxRetries = 3,
): Promise<Response> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetchFn();
            if (!RETRYABLE_STATUSES.has(response.status) || attempt === maxRetries) {
                return response;
            }
            const retryAfter = response.headers.get('retry-after');
            await sleep(backoffMs(attempt, retryAfter));
        } catch (err) {
            if (attempt === maxRetries) throw err;
            await sleep(backoffMs(attempt));
        }
    }
    // Inalcanzable; satisface al compilador.
    throw new Error('fetchWithRetry: salida inesperada');
}
