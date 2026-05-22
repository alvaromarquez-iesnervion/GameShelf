import { useRef } from 'react';
import { container } from '../container';

/**
 * Bridge hook between React and the Inversify container.
 *
 * This is the ONLY point where views connect to the container.
 * ViewModels do not use this hook — they are plain TypeScript classes without React.
 *
 * Usage in a component:
 *   const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
 *
 * - Singleton → always returns the same instance from the container.
 * - Transient → creates a new instance on the first render and keeps it
 *   stable via useRef to avoid re-creation on subsequent renders.
 */
export function useInjection<T>(identifier: symbol): T {
    const ref = useRef<T | null>(null);

    if (ref.current === null) {
        ref.current = container.get<T>(identifier);
    }

    return ref.current;
}
