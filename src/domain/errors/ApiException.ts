/**
 * Structured error thrown by the API client when the backend returns a non-OK response.
 * Extends Error so existing try/catch code (e instanceof Error) continues to work.
 */
export class ApiException extends Error {
    constructor(
        public readonly status: number,
        public readonly code: string,
        public readonly message: string,
        public readonly detail?: unknown,
    ) {
        super(message);
        this.name = 'ApiException';
    }
}
