import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { LibraryViewModel, MergedLibraryGame } from '../../viewmodels/LibraryViewModel';
import { TYPES } from '../../../di/types';
import { LibraryStackParamList } from '../../../core/navigation/navigationTypes';
import { GameCard } from '../../components/games/GameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { LibrarySkeleton } from '../../components/common/LibrarySkeleton';
import { SortCriteria } from '../../../domain/enums/SortCriteria';
import { colors } from '../../theme/colors';
import { styles } from './LibraryScreen.styles';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'Library'>;

const SORT_OPTIONS: { label: string; criteria: SortCriteria; icon: keyof typeof Feather.glyphMap }[] = [
    { label: 'A-Z', criteria: SortCriteria.ALPHABETICAL, icon: 'type' },
    { label: 'Recientes', criteria: SortCriteria.LAST_PLAYED, icon: 'clock' },
    { label: 'Tiempo', criteria: SortCriteria.PLAYTIME, icon: 'bar-chart-2' },
];

export const LibraryScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId && vm.games.length === 0 && !vm.isLoading && !vm.isSyncing) {
            vm.loadLibrary(userId);
        }
    }, [userId, vm]);

    const [searchInput, setSearchInput] = useState(vm.searchQuery);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((query: string) => {
        setSearchInput(query);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            vm.setSearchQuery(query);
        }, 200);
    }, [vm]);

    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    const handleRefresh = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        vm.loadLibrary(userId);
    }, [vm, userId]);

    const handleNavigateWishlist = useCallback(() => {
        (navigation as any).navigate('WishlistStack');
    }, [navigation]);

    const handleGamePress = useCallback((gameId: string, platforms: MergedLibraryGame['platforms']) => {
        navigation.navigate('GameDetail', { gameId, platforms });
    }, [navigation]);

    const handleSortChange = useCallback((criteria: SortCriteria) => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        vm.setSortCriteria(criteria);
    }, [vm]);

    const renderGameCard = useCallback(({ item }: { item: MergedLibraryGame }) => (
        <GameCard
            gameId={item.game.getId()}
            coverUrl={item.game.getCoverUrl()}
            portraitCoverUrl={item.game.getPortraitCoverUrl()}
            title={item.game.getTitle()}
            platforms={item.platforms}
            onPress={(id) => handleGamePress(id, item.platforms)}
        />
    ), [handleGamePress]);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.actionCircle}
                        onPress={handleRefresh}
                    >
                        <Feather name="rotate-cw" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionCircle}
                        onPress={handleNavigateWishlist}
                    >
                        <Feather name="heart" size={18} color={colors.error} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, handleRefresh, handleNavigateWishlist]);

    if (vm.isLoading && vm.games.length === 0) return <LibrarySkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={handleRefresh} />;

    const gameCount = vm.mergedFilteredGames.length;

    return (
        <View style={styles.container}>
            {/* Subtle header glow */}
            <LinearGradient
                colors={[colors.primarySubtle, 'transparent']}
                style={styles.headerGlow}
                pointerEvents="none"
            />
            <View style={[styles.header, { paddingTop: insets.top + 44 }]}>
                <View style={styles.titleRow}>
                    <Text style={styles.largeTitle}>Biblioteca</Text>
                    {gameCount > 0 && (
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{gameCount}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.searchContainer}>
                    <Feather name="search" size={16} color={colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar en la coleccion"
                        placeholderTextColor={colors.textTertiary}
                        value={searchInput}
                        onChangeText={handleSearchChange}
                        clearButtonMode="while-editing"
                        selectionColor={colors.primary}
                        keyboardAppearance="dark"
                    />
                </View>
                <View style={styles.sortBar}>
                    {SORT_OPTIONS.map(({ label, criteria, icon }) => {
                        const isActive = vm.sortCriteria === criteria;
                        return (
                            <TouchableOpacity
                                key={criteria}
                                style={[styles.sortChip, isActive && styles.sortChipActive]}
                                onPress={() => handleSortChange(criteria)}
                                activeOpacity={0.7}
                            >
                                <Feather
                                    name={icon}
                                    size={12}
                                    color={isActive ? colors.primary : colors.textTertiary}
                                />
                                <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
            <FlatList
                data={vm.mergedFilteredGames}
                keyExtractor={(item) => item.game.getId()}
                numColumns={3}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                initialNumToRender={12}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews={true}
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isLoading}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                renderItem={renderGameCard}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <EmptyState
                            message="Tu coleccion esta esperando. Vincula una plataforma para importar tus juegos."
                            icon="plus-circle"
                        />
                    </View>
                }
            />
        </View>
    );
});
