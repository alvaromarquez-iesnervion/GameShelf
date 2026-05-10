import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { LibraryViewModel } from '../../viewmodels/LibraryViewModel';
import { LibraryStackParamList } from '../../../core/navigation/navigationTypes';
import { GameCard } from '../../components/games/GameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { LibrarySkeleton } from '../../components/common/LibrarySkeleton';
import { BrandAura } from '../../components/common/BrandAura';
import { LibraryTabBar } from '../../components/library/LibraryTabBar';
import { PlatformFilterChips } from '../../components/library/PlatformFilterChips';
import { SortCriteria } from '../../../domain/enums/SortCriteria';
import { LibraryTab } from '../../../domain/enums/LibraryTab';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { MergedLibraryGame } from '../../../domain/interfaces/repositories/IGameRepository';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'Library'>;

const SORTS: { label: string; criteria: SortCriteria; icon: keyof typeof Feather.glyphMap }[] = [
    { label: 'A–Z', criteria: SortCriteria.ALPHABETICAL, icon: 'type' },
    { label: 'Recientes', criteria: SortCriteria.LAST_PLAYED, icon: 'clock' },
    { label: 'Tiempo', criteria: SortCriteria.PLAYTIME, icon: 'bar-chart-2' },
];

export const LibraryScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';
    const listRef = useRef<FlatList>(null);

    const cardWidth = Math.floor((width - spacing.lg * 2 - spacing.sm * 2) / 3);

    const [searchInput, setSearchInput] = useState(vm.searchQuery);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (userId && vm.games.length === 0 && !vm.isLoading && !vm.isSyncing) {
            vm.loadLibrary(userId);
        }
    }, [userId, vm]);

    useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);

    useEffect(() => {
        if (vm.currentPage > 1) listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [vm.currentPage]);

    const handleSearch = useCallback((q: string) => {
        setSearchInput(q);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => vm.setSearchQuery(q), 220);
    }, [vm]);

    const handleRefresh = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        vm.loadLibrary(userId, 1);
    }, [vm, userId]);

    const handleGamePress = useCallback(
        (gameId: string, platforms: GamePlatform[], steamAppId?: number) =>
            navigation.navigate('GameDetail', { gameId, platforms, steamAppId }),
        [navigation],
    );

    const renderItem = useCallback(({ item }: { item: MergedLibraryGame }) => (
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

    if (vm.isLoading && vm.games.length === 0) return <LibrarySkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={handleRefresh} />;

    return (
        <View style={styles.container}>
            <BrandAura style={styles.aura} />

            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <View style={styles.titleRow}>
                    <View>
                        <Text style={styles.eyebrow}>Tu colección</Text>
                        <Text style={styles.title}>Biblioteca</Text>
                    </View>
                    <View style={styles.actions}>
                        <Pressable
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                            onPress={handleRefresh}
                            accessibilityLabel="Resincronizar"
                        >
                            <Feather name="rotate-cw" size={18} color={colors.primary} />
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
                            onPress={() => (navigation as any).navigate('WishlistStack')}
                            accessibilityLabel="Wishlist"
                        >
                            <Feather name="heart" size={18} color={colors.accentWarm} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.searchBox}>
                    <Feather name="search" size={16} color={colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar en la colección"
                        placeholderTextColor={colors.textTertiary}
                        value={searchInput}
                        onChangeText={handleSearch}
                        clearButtonMode="while-editing"
                        selectionColor={colors.primary}
                        keyboardAppearance="dark"
                    />
                </View>

                <View style={styles.sortRow}>
                    {SORTS.map(({ label, criteria, icon }) => {
                        const active = vm.sortCriteria === criteria;
                        return (
                            <Pressable
                                key={criteria}
                                onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                                    vm.setSortCriteria(criteria);
                                }}
                                style={[styles.chip, active && styles.chipActive]}
                            >
                                <Feather name={icon} size={12} color={active ? colors.primary : colors.textTertiary} />
                                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <LibraryTabBar
                activeTab={vm.activeTab}
                pcCount={vm.pcGameCount}
                consoleCount={vm.consoleGameCount}
                onTabChange={(tab: LibraryTab) => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    vm.setActiveTab(tab);
                    setSearchInput('');
                }}
            />
            <PlatformFilterChips
                activeTab={vm.activeTab}
                selectedPlatforms={vm.selectedPlatforms}
                onTogglePlatform={(p: GamePlatform) => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    vm.togglePlatform(p);
                }}
            />

            <FlatList
                ref={listRef}
                data={vm.games}
                keyExtractor={(item) => item.game.getId()}
                numColumns={3}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                initialNumToRender={12}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isLoading}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                renderItem={renderItem}
                ListFooterComponent={
                    vm.totalPages > 1 ? (
                        <View style={styles.pagination}>
                            <PageBtn
                                icon="chevrons-left"
                                disabled={vm.currentPage === 1}
                                onPress={() => vm.goToFirstPage()}
                            />
                            <PageBtn
                                icon="chevron-left"
                                disabled={vm.currentPage === 1}
                                onPress={() => vm.goToPage(vm.currentPage - 1)}
                            />
                            <Text style={styles.pageText}>{vm.currentPage} / {vm.totalPages}</Text>
                            <PageBtn
                                icon="chevron-right"
                                disabled={vm.currentPage === vm.totalPages}
                                onPress={() => vm.goToPage(vm.currentPage + 1)}
                            />
                            <PageBtn
                                icon="chevrons-right"
                                disabled={vm.currentPage === vm.totalPages}
                                onPress={() => vm.goToLastPage()}
                            />
                        </View>
                    ) : null
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <EmptyState
                            message={
                                vm.activeTab === LibraryTab.PC
                                    ? 'Vincula Steam, Epic o GOG para importar tu colección PC.'
                                    : 'Vincula PlayStation para importar tu colección de consola.'
                            }
                            icon="plus-circle"
                        />
                    </View>
                }
            />
        </View>
    );
});

const PageBtn: React.FC<{ icon: keyof typeof Feather.glyphMap; disabled: boolean; onPress: () => void }> = ({ icon, disabled, onPress }) => (
    <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
            styles.pageBtn,
            disabled && styles.pageBtnDisabled,
            pressed && !disabled && { opacity: 0.7 },
        ]}
    >
        <Feather name={icon} size={16} color={disabled ? colors.textTertiary : colors.primary} />
    </Pressable>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    eyebrow: { ...typography.label, color: colors.secondary },
    title: { ...typography.largeTitle, marginTop: 2 },
    actions: { flexDirection: 'row', gap: spacing.sm },
    iconBtn: {
        width: 40, height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.borderSubtle,
        alignItems: 'center', justifyContent: 'center',
    },
    iconBtnPressed: { backgroundColor: colors.surfaceElevated },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.inputBackground,
        borderColor: colors.inputBorder,
        borderWidth: 1,
        borderRadius: radius.lg,
        height: 42,
        paddingHorizontal: spacing.md,
    },
    searchInput: { ...typography.input, flex: 1, paddingVertical: 0 },
    sortRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    chipActive: {
        backgroundColor: colors.primaryDim,
        borderColor: colors.primaryBorder,
    },
    chipText: { ...typography.caption, fontWeight: '600' },
    chipTextActive: { color: colors.primary },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
    row: { gap: spacing.sm, marginBottom: spacing.sm },
    empty: { paddingTop: spacing.xxxl, paddingHorizontal: spacing.xl },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
    },
    pageBtn: {
        width: 36, height: 36,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.borderSubtle,
        alignItems: 'center', justifyContent: 'center',
    },
    pageBtnDisabled: { opacity: 0.4 },
    pageText: { ...typography.bodySecondary, fontWeight: '600', marginHorizontal: spacing.md },
});
