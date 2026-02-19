import React, { useEffect } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, RefreshControl, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { LibraryViewModel } from '../../viewmodels/LibraryViewModel';
import { TYPES } from '../../../di/types';
import { LibraryStackParamList } from '../../../core/navigation/navigationTypes';
import { GameCard } from '../../components/games/GameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { LibrarySkeleton } from '../../components/common/LibrarySkeleton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'Library'>;

export const LibraryScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId) vm.loadLibrary(userId);
    }, [userId]);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerActions}>
                    <TouchableOpacity 
                        style={styles.actionCircle} 
                        onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            vm.loadLibrary(userId);
                        }}
                    >
                        <Feather name="rotate-cw" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.actionCircle} 
                        onPress={() => (navigation as any).navigate('WishlistStack')}
                    >
                        <Feather name="heart" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, userId]);

    if (vm.isLoading && vm.games.length === 0) return <LibrarySkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={() => vm.loadLibrary(userId)} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={vm.filteredGames}
                keyExtractor={(item) => item.getId()}
                numColumns={3}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.largeTitle}>Mi Biblioteca</Text>
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={16} color={colors.textTertiary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar en la colección"
                                placeholderTextColor={colors.textTertiary}
                                value={vm.searchQuery}
                                onChangeText={(q) => vm.setSearchQuery(q)}
                                clearButtonMode="while-editing"
                                selectionColor={colors.primary}
                            />
                        </View>
                    </View>
                }
                refreshControl={
                    <RefreshControl 
                        refreshing={vm.isLoading} 
                        onRefresh={() => vm.loadLibrary(userId)} 
                        tintColor={colors.primary}
                    />
                }
                renderItem={({ item }) => (
                    <GameCard
                        coverUrl={item.getCoverUrl()}
                        title={item.getTitle()}
                        platform={item.getPlatform()}
                        onPress={() => navigation.navigate('GameDetail', { gameId: item.getId() })}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <EmptyState 
                            message="Tu colección está esperando. Vincula una plataforma para importar tus juegos." 
                            icon="plus-circle" 
                        />
                    </View>
                }
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.background 
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    actionCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surfaceElevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    largeTitle: {
        ...typography.hero,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 40,
        borderWidth: 0,
    },
    searchInput: { 
        flex: 1,
        color: colors.textPrimary, 
        marginLeft: spacing.sm,
        fontSize: 16,
    },
    list: { 
        paddingBottom: 100,
    },
    row: { 
        justifyContent: 'flex-start',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
    },
    emptyContainer: {
        marginTop: 60,
    }
});
