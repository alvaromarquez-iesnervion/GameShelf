import { runInAction } from 'mobx';

/**
 * Base class for all ViewModels.
 *
 * Provides `withLoading`, a generic async helper that eliminates the
 * repetitive try/catch/runInAction boilerplate present in every async method:
 *
 * ```ts
 * // Before
 * runInAction(() => { this._isLoading = true; this._errorMessage = null; });
 * try {
 *   const result = await this._useCase.doSomething();
 *   runInAction(() => { this._items = result; });
 * } catch (e) {
 *   runInAction(() => { this._errorMessage = e instanceof Error ? e.message : 'Error'; });
 * } finally {
 *   runInAction(() => { this._isLoading = false; });
 * }
 *
 * // After
 * await this.withLoading('_isLoading', '_errorMessage', async () => {
 *   const result = await this._useCase.doSomething();
 *   runInAction(() => { this._items = result; });
 * });
 * ```
 *
 * @param loadingKey   Name of the boolean loading flag on `this` (e.g. `'_isLoading'`).
 * @param errorKey     Name of the `string | null` error field on `this` (e.g. `'_errorMessage'`).
 * @param action       Async callback that performs the work.
 * @param rethrow      When `true`, re-throws the caught error after recording it (default: false).
 */
export abstract class BaseViewModel {
    protected async withLoading<T>(
        loadingKey: string,
        errorKey: string,
        action: () => Promise<T>,
        rethrow = false,
    ): Promise<T | undefined> {
        runInAction(() => {
            (this as Record<string, unknown>)[loadingKey] = true;
            (this as Record<string, unknown>)[errorKey] = null;
        });

        try {
            return await action();
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            runInAction(() => {
                (this as Record<string, unknown>)[errorKey] = message;
            });
            if (rethrow) throw e;
            return undefined;
        } finally {
            runInAction(() => {
                (this as Record<string, unknown>)[loadingKey] = false;
            });
        }
    }
}
