import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../di/hooks/useInjection';
import { AuthViewModel } from '../../presentation/viewmodels/AuthViewModel';
import { LibraryViewModel } from '../../presentation/viewmodels/LibraryViewModel';
import { TYPES } from '../../di/types';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';
import { LoadingSpinner } from '../../presentation/components/common/LoadingSpinner';

export const RootNavigator: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const libraryVm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
    const syncStartedRef = useRef(false);

    useEffect(() => {
        authVm.checkAuthState();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Disparar carga de biblioteca una sola vez cuando el usuario pasa a autenticado
    useEffect(() => {
        if (authVm.isAuthenticated && authVm.currentUser && !syncStartedRef.current) {
            syncStartedRef.current = true;
            if (authVm.isGuest) {
                // Invitado: carga desde AsyncStorage local, sin sincronización con Firestore
                libraryVm.loadLibrary(authVm.currentUser.getId());
            } else {
                libraryVm.autoSyncIfNeeded(authVm.currentUser.getId());
            }
        }
        if (!authVm.isAuthenticated) {
            syncStartedRef.current = false;
            libraryVm.resetSyncState();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authVm.isAuthenticated]);

    if (authVm.isLoading && !authVm.isAuthenticated) {
        return <LoadingSpinner />;
    }

    return authVm.isAuthenticated ? <MainTabNavigator /> : <AuthStack />;
});
