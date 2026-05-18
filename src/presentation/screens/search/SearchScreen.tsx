import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SearchViewModel } from '../../viewmodels/SearchViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { HomeViewModel } from '../../viewmodels/HomeViewModel';
import { SearchStackParamList } from '../../../core/navigation/navigationTypes';
import { SearchResultCard } from '../../components/games/SearchResultCard';
import { HomeGameCard } from '../../components/games/HomeGameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { BrandAura } from '../../components/common/BrandAura';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SearchResult } from '../../../domain/entities/SearchResult';
import { Game } from '../../../domain/entities/Game';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

export const SearchScreen: React.FC = observer(() => {
    const navigation = useNavigation<Nav>();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<SearchViewModel>(TYPES.SearchViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const homeVm = useInjection<HomeViewModel>(TYPES.HomeViewModel);

    const userId = authVm.currentUser?.getId() ?? '';
    const [input, setInput] = useState('');
    const [focused, setFocused] = useState(false);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);

    const wishlistGameIds = useMemo(
        () => new Set(wishlistVm.items.map((i) => i.getGameId())),
        [wishlistVm.items],
    );

    useEffect(() => {
        if (userId) homeVm.loadHomeData(userId);
        return () => { if (debounce.current) clearTimeout(debounce.current); };
    }, [userId, homeVm]);

    const handleChange = useCallback((q: string) => {
        setInput(q);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => vm.search(q, userId), 280);
    }, [vm, userId]);

    const clear = useCallback(() => {
        setInput('');
        vm.clearSearch();
        inputRef.current?.blur();
    }, [vm]);

    const onRefresh = useCallback(() => {
        if (userId) homeVm.forceReloadHomeData(userId);
    }, [userId, homeVm]);

    const onResultPress = useCallback((r: SearchResult) => {
        navigation.navigate('GameDetail', {
            gameId: r.getId(),
            steamAppId: r.getSteamAppId() ?? undefined,
            platforms: r.getOwnedPlatforms() ?? undefined,
        });
    }, [navigation]);

    const onGamePress = useCallback((g: Game) => {
        navigation.navigate('GameDetail', {
            gameId: g.getId(),
            steamAppId: g.getSteamAppId() ?? undefined,
            platforms: [g.getPlatform()],
        });
    }, [navigation]);

    const onToggleWishlist = useCallback(async (r: SearchResult) => {
        if (!userId) return;
        const inWl = wishlistGameIds.has(r.getId());
        if (inWl) {
            const item = wishlistVm.items.find((i) => i.getGameId() === r.getId());
            if (item) await wishlistVm.removeFromWishlist(userId, item.getId());
        } else {
            const wlItem = new WishlistItem(
                '',
                r.getId(),
                r.getTitle(),
                r.getCoverUrl(),
                '',
                new Date(),
                null,
                null,
                r.getSteamAppId() ?? null,
            );
            await wishlistVm.addToWishlist(userId, wlItem);
        }
    }, [userId, wishlistVm, wishlistGameIds]);

    const renderResult = useCallback(({ item }: { item: SearchResult }) => (
        <SearchResultCard
            coverUrl={item.getCoverUrl()}
            title={item.getTitle()}
            isInWishlist={wishlistGameIds.has(item.getId())}
            isOwned={item.getIsOwned() ?? false}
            ownedPlatforms={item.getOwnedPlatforms() ?? []}
            onPress={() => onResultPress(item)}
            onToggleWishlist={() => onToggleWishlist(item)}
        />
    ), [wishlistGameIds, onResultPress, onToggleWishlist]);

    const isSearching = input.trim().length > 0;

    return (
        <View style={styles.container}>
            <BrandAura style={styles.aura} />

            <ScreenHeader eyebrow="Explora" title="Descubre" />
            <View style={styles.searchContainer}>
                <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
                    <Feather name="search" size={18} color={focused ? colors.primary : colors.textTertiary} />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder="Buscar título, saga, estudio…"
                        placeholderTextColor={colors.textTertiary}
                        value={input}
                        onChangeText={handleChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectionColor={colors.primary}
                        keyboardAppearance="dark"
                        returnKeyType="search"
                    />
                    {input.length > 0 && (
                        <Pressable hitSlop={8} onPress={clear}>
                            <Feather name="x-circle" size={18} color={colors.textSecondary} />
                        </Pressable>
                    )}
                </View>
            </View>

            {isSearching ? (
                vm.errorMessage ? (
                    <ErrorMessage message={vm.errorMessage} onRetry={() => vm.search(input, userId)} />
                ) : vm.isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : vm.results.length === 0 ? (
                    <View style={styles.center}>
                        <EmptyState message={`Sin resultados para "${input}".`} icon="frown" />
                    </View>
                ) : (
                    <FlatList
                        data={vm.results}
                        keyExtractor={(item) => item.getId()}
                        renderItem={renderResult}
                        contentContainerStyle={styles.resultsList}
                        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                        keyboardShouldPersistTaps="handled"
                        initialNumToRender={10}
                        maxToRenderPerBatch={6}
                        windowSize={5}
                    />
                )
            ) : (
                <ScrollView
                    contentContainerStyle={styles.discoverScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={homeVm.isLoadingHome}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {homeVm.errorMessage && (
                        <View style={styles.errorBanner}>
                            <Feather name="alert-circle" size={14} color={colors.error} />
                            <Text style={styles.errorText} numberOfLines={2}>{homeVm.errorMessage}</Text>
                        </View>
                    )}

                    <Carousel
                        title="Populares ahora"
                        subtitle="Lo más jugado en la comunidad"
                        icon="trending-up"
                        accent={colors.primary}
                        games={homeVm.popularGames}
                        loading={homeVm.isLoadingHome && homeVm.popularGames.length === 0}
                        onGamePress={onGamePress}
                        cardSize="featured"
                        showRank
                        emptyHint="No hay juegos populares ahora mismo."
                    />

                    <Carousel
                        title="Jugados recientemente"
                        subtitle={homeVm.isSteamLinked ? 'Tu actividad reciente en Steam' : 'Vincula Steam para ver tu actividad'}
                        icon="clock"
                        accent={colors.secondary}
                        games={homeVm.recentlyPlayed}
                        loading={homeVm.isLoadingHome && homeVm.recentlyPlayed.length === 0}
                        onGamePress={onGamePress}
                        cardSize="medium"
                        emptyHint={homeVm.isSteamLinked ? 'Aún no has jugado nada.' : 'Sin Steam vinculado.'}
                    />

                    <Carousel
                        title="Tus más jugados"
                        subtitle="Top 5 por horas en biblioteca"
                        icon="bar-chart-2"
                        accent={colors.accentWarm}
                        games={homeVm.mostPlayed}
                        loading={homeVm.isLoadingHome && homeVm.mostPlayed.length === 0}
                        onGamePress={onGamePress}
                        cardSize="medium"
                        emptyHint="Aún no tienes juegos con horas registradas."
                    />

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </View>
    );
});

interface CarouselProps {
    title: string;
    subtitle: string;
    icon: keyof typeof Feather.glyphMap;
    accent: string;
    games: Game[];
    loading: boolean;
    onGamePress: (g: Game) => void;
    cardSize: 'featured' | 'medium' | 'small';
    showRank?: boolean;
    emptyHint: string;
}

const Carousel: React.FC<CarouselProps> = ({
    title, subtitle, icon, accent, games, loading, onGamePress, cardSize, showRank, emptyHint,
}) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: accent + '22' }]}>
                <Feather name={icon} size={14} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionSubtitle}>{subtitle}</Text>
            </View>
        </View>

        {loading ? (
            <View style={styles.carouselLoading}>
                <ActivityIndicator color={accent} />
            </View>
        ) : games.length === 0 ? (
            <View style={styles.carouselEmpty}>
                <Text style={styles.carouselEmptyText}>{emptyHint}</Text>
            </View>
        ) : (
            <FlatList
                data={games}
                keyExtractor={(g) => g.getId()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContent}
                ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
                renderItem={({ item, index }) => (
                    <HomeGameCard
                        coverUrl={item.getCoverUrl()}
                        portraitCoverUrl={item.getPortraitCoverUrl()}
                        title={item.getTitle()}
                        onPress={() => onGamePress(item)}
                        size={cardSize}
                        rank={showRank ? index + 1 : undefined}
                    />
                )}
            />
        )}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 240 },
    searchContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.inputBackground,
        borderColor: colors.inputBorder,
        borderWidth: 1,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        height: 48,
    },
    searchBoxFocused: {
        borderColor: colors.inputFocusBorder,
        backgroundColor: colors.surfaceElevated,
    },
    searchInput: { ...typography.input, flex: 1, paddingVertical: 0 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
    resultsList: { paddingHorizontal: spacing.lg, paddingBottom: 100, paddingTop: spacing.sm },
    discoverScroll: { paddingTop: spacing.sm, paddingBottom: spacing.md },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginHorizontal: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.errorBackground,
        borderColor: colors.errorBorder,
        borderWidth: 1,
        borderRadius: radius.md,
        marginBottom: spacing.md,
    },
    errorText: { ...typography.caption, color: colors.error, flex: 1 },
    section: { marginBottom: spacing.xl },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    sectionIcon: {
        width: 30, height: 30,
        borderRadius: radius.full,
        alignItems: 'center', justifyContent: 'center',
    },
    sectionTitle: { ...typography.title, fontSize: 18 },
    sectionSubtitle: { ...typography.caption, marginTop: 1, color: colors.textSecondary },
    carouselContent: { paddingHorizontal: spacing.lg },
    carouselLoading: {
        height: 180,
        alignItems: 'center', justifyContent: 'center',
    },
    carouselEmpty: {
        marginHorizontal: spacing.lg,
        padding: spacing.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1, borderColor: colors.borderSubtle,
    },
    carouselEmptyText: { ...typography.bodySecondary, textAlign: 'center' },
});
