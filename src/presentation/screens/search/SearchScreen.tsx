import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, TextInput, Platform, Text, ScrollView, TouchableOpacity, StyleSheet, ListRenderItemInfo } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { HomeViewModel } from '../../viewmodels/HomeViewModel';
import { SearchViewModel } from '../../viewmodels/SearchViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { TYPES } from '../../../di/types';
import { SearchStackParamList } from '../../../core/navigation/navigationTypes';
import { SearchResult } from '../../../domain/entities/SearchResult';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { SearchResultCard } from '../../components/games/SearchResultCard';
import { HomeGameCard } from '../../components/games/HomeGameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, layout } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

const ITEM_HEIGHT = 75 + (spacing.sm * 2) + StyleSheet.hairlineWidth * 2;
const ITEM_MARGIN = spacing.sm;

const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    if (hours >= 100) return `${hours}h`;
    if (hours >= 1) return `${hours}h jugadas`;
    return `${minutes}min`;
};

interface SectionHeaderProps {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    accentColor?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, title, accentColor = colors.primary }) => (
    <View style={sectionStyles.header}>
        <View style={[sectionStyles.iconDot, { backgroundColor: accentColor }]}>
            <Feather name={icon} size={14} color={colors.onPrimary} />
        </View>
        <Text style={sectionStyles.title}>{title}</Text>
    </View>
);

const sectionStyles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    iconDot: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...typography.title,
        color: colors.textPrimary,
        fontWeight: '700',
    },
});

export const SearchScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<HomeViewModel>(TYPES.HomeViewModel);
    const searchVm = useInjection<SearchViewModel>(TYPES.SearchViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [inputText, setInputText] = useState('');

    const handleLoadHomeData = useCallback(() => {
        if (userId) vm.loadHomeData(userId);
    }, [userId, vm]);

    const handleGamePress = useCallback((gameId: string, steamAppId?: number, platforms?: GamePlatform[]) => {
        navigation.navigate('GameDetail', { gameId, steamAppId, platforms });
    }, [navigation]);

    const handleNavigateSettings = useCallback(() => {
        navigation.getParent()?.navigate('SettingsTab' as never);
    }, [navigation]);

    const handleRetry = useCallback(() => {
        vm.loadHomeData(userId);
    }, [vm, userId]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    useFocusEffect(handleLoadHomeData);

    const handleSearch = useCallback((text: string) => {
        setInputText(text);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!text.trim()) {
            searchVm.clearSearch();
            return;
        }

        debounceRef.current = setTimeout(() => {
            searchVm.search(text, userId);
        }, 400);
    }, [userId, searchVm]);

    const toggleWishlist = useCallback(async (result: { getId: () => string; getTitle: () => string; getCoverUrl: () => string; getIsOwned: () => boolean }) => {
        if (result.getIsOwned()) return;

        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        const inWishlist = wishlistVm.isGameInWishlist(result.getId());
        if (inWishlist) {
            const item = wishlistVm.items.find(i => i.getGameId() === result.getId());
            if (item) await wishlistVm.removeFromWishlist(userId, item.getId());
        } else {
            const newItem = new WishlistItem(
                Date.now().toString(), result.getId(), result.getTitle(),
                result.getCoverUrl(), new Date(), null,
            );
            await wishlistVm.addToWishlist(userId, newItem);
        }
    }, [wishlistVm, userId]);

    const renderSearchResult = useCallback(({ item }: ListRenderItemInfo<SearchResult>) => (
        <SearchResultCard
            coverUrl={item.getCoverUrl()}
            title={item.getTitle()}
            isInWishlist={wishlistVm.isGameInWishlist(item.getId())}
            isOwned={item.getIsOwned()}
            ownedPlatforms={item.getOwnedPlatforms()}
            onPress={() => handleGamePress(item.getId(), item.getSteamAppId() ?? undefined, item.getOwnedPlatforms())}
            onToggleWishlist={() => toggleWishlist(item)}
        />
    ), [handleGamePress, toggleWishlist, wishlistVm]);

    const renderHomeContent = () => (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Popular Games — Featured Section */}
            {vm.popularGames.length > 0 && (
                <View style={styles.section}>
                    <SectionHeader icon="trending-up" title="Populares ahora" accentColor={colors.accentWarm} />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                        decelerationRate="fast"
                        snapToInterval={170}
                    >
                        {vm.popularGames.map((game, index) => (
                            <HomeGameCard
                                key={game.getId()}
                                coverUrl={game.getCoverUrl()}
                                title={game.getTitle()}
                                size="featured"
                                rank={index + 1}
                                onPress={() => handleGamePress(game.getId())}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Recently Played */}
            {vm.recentlyPlayed.length > 0 ? (
                <View style={styles.section}>
                    <SectionHeader icon="play" title="Continua jugando" accentColor={colors.success} />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    >
                        {vm.recentlyPlayed.map((game) => (
                            <HomeGameCard
                                key={game.getId()}
                                coverUrl={game.getCoverUrl()}
                                title={game.getTitle()}
                                subtitle={formatPlaytime(game.getPlaytime())}
                                onPress={() => handleGamePress(game.getId())}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.section}>
                    <SectionHeader icon="play" title="Continua jugando" accentColor={colors.success} />
                    <View style={styles.emptySection}>
                        <LinearGradient
                            colors={['rgba(50, 215, 75, 0.08)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <Feather name="link" size={20} color={colors.success} />
                        <Text style={styles.emptySectionText}>Vincula Steam para ver tus juegos recientes</Text>
                    </View>
                </View>
            )}

            {/* Most Played */}
            {vm.mostPlayed.length > 0 ? (
                <View style={styles.section}>
                    <SectionHeader icon="award" title="Tus mas jugados" accentColor={colors.accent} />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    >
                        {vm.mostPlayed.map((game) => (
                            <HomeGameCard
                                key={game.getId()}
                                coverUrl={game.getCoverUrl()}
                                title={game.getTitle()}
                                subtitle={formatPlaytime(game.getPlaytime())}
                                size="small"
                                onPress={() => handleGamePress(game.getId())}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.section}>
                    <SectionHeader icon="award" title="Tus mas jugados" accentColor={colors.accent} />
                    <View style={styles.emptySection}>
                        <LinearGradient
                            colors={['rgba(255, 159, 10, 0.08)', 'transparent']}
                            style={StyleSheet.absoluteFill}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                        <Feather name="clock" size={20} color={colors.accent} />
                        <Text style={styles.emptySectionText}>Vincula Steam para ver tus estadisticas</Text>
                    </View>
                </View>
            )}

            {/* CTA when no data */}
            {vm.recentlyPlayed.length === 0 && vm.mostPlayed.length === 0 && (
                <View style={styles.emptyHome}>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={handleNavigateSettings}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.secondary]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.linkButtonGradient}
                        >
                            <Feather name="link" size={18} color={colors.onPrimary} />
                            <Text style={styles.linkButtonText}>Vincular Steam</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    const renderSearchResults = () => (
        <FlatList
            data={searchVm.results}
            keyExtractor={(item) => item.getId()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
            getItemLayout={(_data, index) => ({
                length: ITEM_HEIGHT + ITEM_MARGIN,
                offset: index * (ITEM_HEIGHT + ITEM_MARGIN),
                index,
            })}
            renderItem={renderSearchResult}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <EmptyState message="No encontramos resultados para tu busqueda." icon="frown" />
                </View>
            }
        />
    );

    return (
        <View style={styles.container}>
            {/* Header gradient accent */}
            <LinearGradient
                colors={[colors.primaryGlow, 'transparent']}
                style={styles.headerGlow}
                pointerEvents="none"
            />
            <View style={[styles.searchHeader, { paddingTop: insets.top + 52 }]}>
                <Text style={styles.heroTitle}>Descubre</Text>
                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color={colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar en el catalogo global"
                        placeholderTextColor={colors.textTertiary}
                        onChangeText={handleSearch}
                        value={inputText}
                        autoCorrect={false}
                        selectionColor={colors.primary}
                        keyboardAppearance="dark"
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            {searchVm.isLoading ? (
                <ListSkeleton />
            ) : inputText.trim().length > 0 && searchVm.errorMessage ? (
                <ErrorMessage message={searchVm.errorMessage} onRetry={() => searchVm.search(inputText, userId)} />
            ) : vm.errorMessage && inputText.trim().length === 0 ? (
                <ErrorMessage message={vm.errorMessage} onRetry={handleRetry} />
            ) : inputText.trim().length > 0 ? (
                renderSearchResults()
            ) : (
                renderHomeContent()
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    searchHeader: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
    },
    heroTitle: {
        ...typography.heroLarge,
        marginBottom: spacing.lg,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        paddingHorizontal: spacing.lg,
        height: 48,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtleLight,
    },
    searchInput: {
        flex: 1,
        ...typography.input,
        fontSize: 17,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: layout.tabBarClearance,
    },
    section: {
        marginTop: spacing.xl,
    },
    horizontalList: {
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
    },
    list: {
        paddingBottom: layout.tabBarClearance,
    },
    emptyContainer: {
        marginTop: 100,
    },
    emptySection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        padding: spacing.lg,
        borderRadius: radius.xl,
        gap: spacing.md,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.borderSubtle,
    },
    emptySectionText: {
        ...typography.bodySecondary,
        color: colors.textTertiary,
        flex: 1,
    },
    emptyHome: {
        marginTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    linkButton: {
        borderRadius: radius.xl,
        overflow: 'hidden',
    },
    linkButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md + 2,
        gap: spacing.sm,
    },
    linkButtonText: {
        ...typography.button,
        color: colors.onPrimary,
        fontWeight: '700',
    },
});
