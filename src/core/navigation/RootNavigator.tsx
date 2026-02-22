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
    }, []);

    // Disparar auto-sync una sola vez cuando el usuario pasa a autenticado
    useEffect(() => {
        if (authVm.isAuthenticated && authVm.currentUser && !syncStartedRef.current) {
            syncStartedRef.current = true;
            libraryVm.autoSyncIfNeeded(authVm.currentUser.getId());
        }
        if (!authVm.isAuthenticated) {
            syncStartedRef.current = false;
        }
    }, [authVm.isAuthenticated]);

    if (authVm.isLoading && !authVm.isAuthenticated) {
        return <LoadingSpinner />;
    }

    return authVm.isAuthenticated ? <MainTabNavigator /> : <AuthStack />;
});
