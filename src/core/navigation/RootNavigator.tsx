import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useInjection } from '../../di/hooks/useInjection';
import { AuthViewModel } from '../../presentation/viewmodels/AuthViewModel';
import { TYPES } from '../../di/types';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';
import { LoadingSpinner } from '../../presentation/components/common/LoadingSpinner';

export const RootNavigator: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);

    useEffect(() => {
        authVm.checkAuthState();
    }, []);

    if (authVm.isLoading && !authVm.isAuthenticated) {
        return <LoadingSpinner />;
    }

    return authVm.isAuthenticated ? <MainTabNavigator /> : <AuthStack />;
});
