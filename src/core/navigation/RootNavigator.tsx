import React, { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../di/hooks/useInjection';
import { AuthViewModel } from '../../presentation/viewmodels/AuthViewModel';
import { LibraryViewModel } from '../../presentation/viewmodels/LibraryViewModel';
import { PushNotificationService } from '../../data/services/PushNotificationService';
import { TYPES } from '../../di/types';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';
import { LoadingSpinner } from '../../presentation/components/common/LoadingSpinner';

export const RootNavigator: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const libraryVm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
    const pushService = useInjection<PushNotificationService>(TYPES.PushNotificationService);
    const syncStartedRef = useRef(false);

    useEffect(() => {
        authVm.checkAuthState().catch(e => console.warn('[RootNavigator] checkAuthState failed:', e));
    }, [authVm]);

    // Inicializar push notifications una sola vez cuando el usuario pasa a autenticado
    useEffect(() => {
        if (authVm.isAuthenticated && authVm.currentUser && !syncStartedRef.current) {
            syncStartedRef.current = true;
            if (!authVm.isGuest) {
                pushService.initialize(authVm.currentUser.getId()).catch(e =>
                    console.warn('[RootNavigator] push init failed:', e),
                );
            }
        }
        if (!authVm.isAuthenticated) {
            syncStartedRef.current = false;
            libraryVm.resetSyncState();
        }
    }, [authVm.isAuthenticated, authVm.currentUser, authVm.isGuest, libraryVm, pushService]);

    // Carga de biblioteca (mantener logica existente separada)
    useEffect(() => {
        if (authVm.isAuthenticated && authVm.currentUser && syncStartedRef.current) {
            if (authVm.isGuest) {
                libraryVm.loadLibrary(authVm.currentUser.getId());
            } else {
                libraryVm.autoSyncIfNeeded(authVm.currentUser.getId());
            }
        }
    }, [authVm.isAuthenticated, authVm.currentUser, authVm.isGuest, libraryVm]);

    if (authVm.isLoading && !authVm.isAuthenticated) {
        return <LoadingSpinner />;
    }

    return authVm.isAuthenticated ? <MainTabNavigator /> : <AuthStack />;
});
RootNavigator.displayName = 'RootNavigator';
