import { useRef } from 'react';
import { container } from '../container';

/**
 * Hook puente entre React y el contenedor Inversify.
 *
 * Es el ÚNICO punto donde las vistas se conectan con el contenedor.
 * Los ViewModels no usan este hook: son clases TypeScript puras sin React.
 *
 * Uso en un componente:
 *   const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
 *
 * - Singleton → siempre devuelve la misma instancia del contenedor.
 * - Transient → crea una nueva instancia en el primer render y la mantiene
 *   estable con useRef para no recrearla en re-renders del mismo componente.
 */
export function useInjection<T>(identifier: symbol): T {
    const ref = useRef<T | null>(null);

    if (ref.current === null) {
        ref.current = container.get<T>(identifier);
    }

    return ref.current;
}
