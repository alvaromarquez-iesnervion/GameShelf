import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, TextInput, StyleSheet, Platform, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { HomeViewModel } from '../../viewmodels/HomeViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { TYPES } from '../../../di/types';
import { SearchStackParamList } from '../../../core/navigation/navigationTypes';
import { SearchResultCard } from '../../components/games/SearchResultCard';
import { HomeGameCard } from '../../components/games/HomeGameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { Game } from '../../../domain/entities/Game';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

const formatPlaytime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    if (hours >= 100) return `${hours}h`;
    if (hours >= 1) return `${hours}h jugadas`;
    return `${minutes}min`;
};

export const SearchScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<HomeViewModel>(TYPES.HomeViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [inputText, setInputText] = useState('');

    useFocusEffect(
        useCallback(() => {
            if (userId) vm.loadHomeData(userId);
        }, [userId, vm]),
    );

    const handleSearch = useCallback((text: string) => {
        setInputText(text);
        
        if (debounceRef.current) clearTimeout(debounceRef.current);
        
        if (!text.trim()) {
            vm.clearSearch();
            return;
        }
        
        debounceRef.current = setTimeout(() => {
            if (Platform.OS !== 'web' && text.length > 2) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            vm.search(text, userId);
        }, 400);
    }, [userId, vm]);

    const toggleWishlist = async (result: { getId: () => string; getTitle: () => string; getCoverUrl: () => string }) => {
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
    };

    const renderHomeContent = () => (
        <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {vm.popularGames.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Populares ahora</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    >
                        {vm.popularGames.map((game) => (
                            <HomeGameCard
                                key={game.getId()}
                                coverUrl={game.getCoverUrl()}
                                title={game.getTitle()}
                                onPress={() => navigation.navigate('GameDetail', { gameId: game.getId() })}
                            />
                        ))}
                    </ScrollView>
                </View>
            )}

            {vm.recentlyPlayed.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Continúa jugando</Text>
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
                                onPress={() => navigation.navigate('GameDetail', { gameId: game.getId() })}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Continúa jugando</Text>
                    <View style={styles.emptySection}>
                        <Feather name="link" size={20} color={colors.textTertiary} />
                        <Text style={styles.emptySectionText}>Vincula Steam para ver tus juegos recientes</Text>
                    </View>
                </View>
            )}

            {vm.mostPlayed.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tus más jugados</Text>
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
                                onPress={() => navigation.navigate('GameDetail', { gameId: game.getId() })}
                            />
                        ))}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tus más jugados</Text>
                    <View style={styles.emptySection}>
                        <Feather name="clock" size={20} color={colors.textTertiary} />
                        <Text style={styles.emptySectionText}>Vincula Steam para ver tus estadísticas</Text>
                    </View>
                </View>
            )}

            {vm.recentlyPlayed.length === 0 && vm.mostPlayed.length === 0 && (
                <View style={styles.emptyHome}>
                    <TouchableOpacity 
                        style={styles.linkButton}
                        onPress={() => navigation.getParent()?.navigate('SettingsTab' as never)}
                    >
                        <Feather name="link" size={18} color={colors.textPrimary} />
                        <Text style={styles.linkButtonText}>Vincular Steam</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    const renderSearchResults = () => (
        <FlatList
            data={vm.searchResults}
            keyExtractor={(item) => item.getId()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
                <SearchResultCard
                    coverUrl={item.getCoverUrl()}
                    title={item.getTitle()}
                    isInWishlist={wishlistVm.isGameInWishlist(item.getId())}
                    onPress={() => navigation.navigate('GameDetail', { gameId: item.getId() })}
                    onToggleWishlist={() => toggleWishlist(item)}
                />
            )}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <EmptyState message="No encontramos resultados para tu búsqueda." icon="frown" />
                </View>
            }
        />
    );

    return (
        <View style={styles.container}>
            <View style={[styles.searchHeader, { paddingTop: insets.top + 44 }]}>
                <Text style={styles.title}>Descubre</Text>
                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color={colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar en el catálogo global"
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

            {vm.isSearching ? (
                <ListSkeleton />
            ) : vm.errorMessage ? (
                <ErrorMessage message={vm.errorMessage} onRetry={() => vm.loadHomeData(userId)} />
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
        backgroundColor: colors.background 
    },
    searchHeader: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
    },
    title: {
        ...typography.hero,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        paddingHorizontal: spacing.md,
        height: 48,
    },
    searchInput: { 
        flex: 1,
        color: colors.textPrimary, 
        marginLeft: spacing.sm,
        fontSize: 17,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    section: {
        marginTop: spacing.lg,
    },
    sectionTitle: {
        ...typography.subheading,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        marginHorizontal: spacing.lg,
    },
    horizontalList: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    list: { 
        paddingBottom: 100,
    },
    emptyContainer: {
        marginTop: 100,
    },
    emptySection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: spacing.lg,
        padding: spacing.md,
        borderRadius: radius.lg,
        gap: spacing.sm,
    },
    emptySectionText: {
        ...typography.bodySecondary,
        color: colors.textTertiary,
        flex: 1,
    },
    emptyHome: {
        marginTop: 60,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: radius.lg,
        marginTop: spacing.lg,
        gap: spacing.sm,
    },
    linkButtonText: {
        ...typography.button,
        color: colors.textPrimary,
    },
});
