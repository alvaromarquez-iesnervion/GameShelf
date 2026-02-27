import { runInAction } from 'mobx';

/**
 * Generic async helper that eliminates the repetitive try/catch/runInAction
 * boilerplate present in every ViewModel async method.
 *
 * NOTE: implemented as a standalone function (not a base class) because
 * MobX's `makeAutoObservable` cannot be used on classes that have a superclass.
 *
 * Usage:
 * ```ts
 * async loadItems(): Promise<void> {
 *   await withLoading(this, '_isLoading', '_errorMessage', async () => {
 *     const result = await this._useCase.getItems();
 *     runInAction(() => { this._items = result; });
 *   });
 * }
 * ```
 *
 * @param vm         The ViewModel instance (`this`).
 * @param loadingKey Name of the boolean loading flag (e.g. `'_isLoading'`).
 * @param errorKey   Name of the `string | null` error field (e.g. `'_errorMessage'`).
 * @param action     Async callback that performs the work.
 * @param rethrow    When `true`, re-throws the caught error after recording it (default: false).
 */
export async function withLoading<T>(
    vm: object,
    loadingKey: string,
    errorKey: string,
    action: () => Promise<T>,
    rethrow = false,
): Promise<T | undefined> {
    const target = vm as Record<string, unknown>;

    runInAction(() => {
        target[loadingKey] = true;
        target[errorKey] = null;
    });

    try {
        return await action();
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        runInAction(() => {
            target[errorKey] = message;
        });
        if (rethrow) throw e;
        return undefined;
    } finally {
        runInAction(() => {
            target[loadingKey] = false;
        });
    }
}
