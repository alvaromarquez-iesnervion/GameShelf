import React, { useEffect, useCallback, useRef, useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, RefreshControl, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { BrandAura } from '../../components/common/BrandAura';
import { SortCriteria } from '../../../domain/enums/SortCriteria';
import { LibraryTab } from '../../../domain/enums/LibraryTab';
import { MergedLibraryGame } from '../../../domain/interfaces/repositories/IGameRepository';
import { LibraryTabBar } from '../../components/library/LibraryTabBar';
import { PlatformFilterChips } from '../../components/library/PlatformFilterChips';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { styles } from './LibraryScreen.styles';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'Library'>;

const SORT_OPTIONS: { label: string; criteria: SortCriteria; icon: keyof typeof Feather.glyphMap }[] = [
    { label: 'A-Z', criteria: SortCriteria.ALPHABETICAL, icon: 'type' },
    { label: 'Recientes', criteria: SortCriteria.LAST_PLAYED, icon: 'clock' },
    { label: 'Tiempo', criteria: SortCriteria.PLAYTIME, icon: 'bar-chart-2' },
];

export const LibraryScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';
    const flatListRef = useRef<FlatList>(null);

    // 3-column grid with perfect gutters (aligned with screen padding)
    const cardWidth = Math.floor((windowWidth - (spacing.lg * 2) - (spacing.sm * 2)) / 3);

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

    useEffect(() => {
        if (vm.currentPage > 1 && flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: false });
        }
    }, [vm.currentPage]);

    const handleRefresh = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        vm.loadLibrary(userId, 1);
    }, [vm, userId]);

    const handleNavigateWishlist = useCallback(() => {
        (navigation as any).navigate('WishlistStack');
    }, [navigation]);

    const handleGamePress = useCallback(
        (gameId: string, platforms: MergedLibraryGame['platforms'], steamAppId?: number) => {
            navigation.navigate('GameDetail', { gameId, platforms, steamAppId });
        },
        [navigation],
    );

    const handleSortChange = useCallback((criteria: SortCriteria) => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        vm.setSortCriteria(criteria);
    }, [vm]);

    const handleTabChange = useCallback((tab: LibraryTab) => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        vm.setActiveTab(tab);
        setSearchInput('');
    }, [vm]);

    const handleTogglePlatform = useCallback((platform: GamePlatform) => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        vm.togglePlatform(platform);
    }, [vm]);

    const renderGameCard = useCallback(({ item }: { item: MergedLibraryGame }) => (
        <GameCard
            gameId={item.game.getId()}
            coverUrl={item.game.getCoverUrl()}
            portraitCoverUrl={item.game.getPortraitCoverUrl()}
            title={item.game.getTitle()}
            platforms={item.platforms}
            cardWidth={cardWidth}
            onPress={(id) => handleGamePress(id, item.platforms, item.game.getSteamAppId() ?? undefined)}
        />
    ), [handleGamePress, cardWidth]);

    const renderPaginationFooter = useCallback(() => {
        if (vm.totalPages <= 1) return null;

        return (
            <View style={styles.paginationContainer}>
                <TouchableOpacity
                    style={[styles.pageButton, vm.currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => vm.goToFirstPage()}
                    disabled={vm.currentPage === 1}
                    activeOpacity={0.7}
                >
                    <Feather name="chevrons-left" size={16} color={vm.currentPage === 1 ? colors.textTertiary : colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.pageButton, vm.currentPage === 1 && styles.pageButtonDisabled]}
                    onPress={() => vm.goToPage(vm.currentPage - 1)}
                    disabled={vm.currentPage === 1}
                    activeOpacity={0.7}
                >
                    <Feather name="chevron-left" size={16} color={vm.currentPage === 1 ? colors.textTertiary : colors.primary} />
                </TouchableOpacity>

                <View style={styles.pageInfo}>
                    <Text style={styles.pageText}>
                        {vm.currentPage} / {vm.totalPages}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.pageButton, vm.currentPage === vm.totalPages && styles.pageButtonDisabled]}
                    onPress={() => vm.goToPage(vm.currentPage + 1)}
                    disabled={vm.currentPage === vm.totalPages}
                    activeOpacity={0.7}
                >
                    <Feather name="chevron-right" size={16} color={vm.currentPage === vm.totalPages ? colors.textTertiary : colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.pageButton, vm.currentPage === vm.totalPages && styles.pageButtonDisabled]}
                    onPress={() => vm.goToLastPage()}
                    disabled={vm.currentPage === vm.totalPages}
                    activeOpacity={0.7}
                >
                    <Feather name="chevrons-right" size={16} color={vm.currentPage === vm.totalPages ? colors.textTertiary : colors.primary} />
                </TouchableOpacity>
            </View>
        );
    }, [vm]);

    const renderLoadingMoreIndicator = useCallback(() => {
        if (!vm.isLoadingMore) return null;
        return (
            <View style={styles.loadingMoreContainer}>
                <Text style={styles.loadingMoreText}>Cargando más...</Text>
            </View>
        );
    }, [vm.isLoadingMore]);

    if (vm.isLoading && vm.games.length === 0) return <LibrarySkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={handleRefresh} />;

    return (
        <View style={styles.container}>
            {/* Header aura (signature) */}
            <BrandAura style={styles.headerGlow} />
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <View style={styles.titleRow}>
                    <View style={styles.titleLeft}>
                        <Text style={styles.largeTitle}>Biblioteca</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.actionCircle}
                            onPress={handleRefresh}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Resincronizar biblioteca"
                        >
                            <Feather name="rotate-cw" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionCircle}
                            onPress={handleNavigateWishlist}
                            activeOpacity={0.8}
                            accessibilityRole="button"
                            accessibilityLabel="Abrir wishlist"
                        >
                            <Feather name="heart" size={18} color={colors.error} />
                        </TouchableOpacity>
                    </View>
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
            <LibraryTabBar
                activeTab={vm.activeTab}
                pcCount={vm.pcGameCount}
                consoleCount={vm.consoleGameCount}
                onTabChange={handleTabChange}
            />
            <PlatformFilterChips
                activeTab={vm.activeTab}
                selectedPlatforms={vm.selectedPlatforms}
                onTogglePlatform={handleTogglePlatform}
            />
            <FlatList
                ref={flatListRef}
                data={vm.games}
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
                ListFooterComponent={() => (
                    <>
                        {renderLoadingMoreIndicator()}
                        {renderPaginationFooter()}
                    </>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <EmptyState
                            message={
                                vm.activeTab === LibraryTab.PC
                                    ? 'Tu coleccion PC esta esperando. Vincula Steam, Epic o GOG para importar tus juegos.'
                                    : 'Tu coleccion de consola esta esperando. Vincula PlayStation para importar tus juegos.'
                            }
                            icon="plus-circle"
                        />
                    </View>
                }
            />
        </View>
    );
});
