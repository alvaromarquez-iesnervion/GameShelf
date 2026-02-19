import React, { useCallback, useRef } from 'react';
import { View, FlatList, TextInput, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SearchViewModel } from '../../viewmodels/SearchViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { TYPES } from '../../../di/types';
import { SearchStackParamList } from '../../../core/navigation/navigationTypes';
import { SearchResultCard } from '../../components/games/SearchResultCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { colors } from '../../theme/colors';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

export const SearchScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<SearchViewModel>(TYPES.SearchViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((text: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (Platform.OS !== 'web' && text.length > 2) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    return (
        <View style={styles.container}>
            <View style={styles.searchHeader}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={18} color={colors.textTertiary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar en el catálogo global"
                        placeholderTextColor={colors.textTertiary}
                        onChangeText={handleSearch}
                        autoCorrect={false}
                        selectionColor={colors.primary}
                        keyboardAppearance="dark"
                        clearButtonMode="while-editing"
                    />
                </View>
            </View>

            {vm.isLoading ? (
                <ListSkeleton />
            ) : vm.errorMessage ? (
                <ErrorMessage message={vm.errorMessage} onRetry={() => vm.search(vm.query, userId)} />
            ) : (
                <FlatList
                    data={vm.results}
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
                            {vm.query ? (
                                <EmptyState message="No encontramos resultados para tu búsqueda." icon="frown" />
                            ) : (
                                <EmptyState message="Explora millones de títulos y encuentra las mejores ofertas." icon="compass" />
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchHeader: {
        paddingTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
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
    list: { 
        paddingBottom: 100,
    },
    emptyContainer: {
        marginTop: 100,
    }
});
