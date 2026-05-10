import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { SearchViewModel } from '../../viewmodels/SearchViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { SearchStackParamList } from '../../../core/navigation/navigationTypes';
import { SearchResultCard } from '../../components/games/SearchResultCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { BrandAura } from '../../components/common/BrandAura';
import { SearchResult } from '../../../domain/entities/SearchResult';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

export const SearchScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<SearchViewModel>(TYPES.SearchViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);

    const userId = authVm.currentUser?.getId() ?? '';
    const [input, setInput] = useState('');
    const [focused, setFocused] = useState(false);
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);

    const wishlistGameIds = useMemo(
        () => new Set(wishlistVm.items.map((i) => i.getGameId())),
        [wishlistVm.items],
    );

    useEffect(() => () => { if (debounce.current) clearTimeout(debounce.current); }, []);

    const handleChange = useCallback((q: string) => {
        setInput(q);
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => vm.search(q, userId), 280);
    }, [vm, userId]);

    const clear = useCallback(() => {
        setInput('');
        vm.clearSearch();
        inputRef.current?.focus();
    }, [vm]);

    const onResultPress = useCallback((r: SearchResult) => {
        navigation.navigate('GameDetail', {
            gameId: r.getId(),
            steamAppId: r.getSteamAppId() ?? undefined,
            platforms: r.getOwnedPlatforms() ?? undefined,
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
                new Date(),
                null,
                null,
                r.getSteamAppId() ?? null,
            );
            await wishlistVm.addToWishlist(userId, wlItem);
        }
    }, [userId, wishlistVm, wishlistGameIds]);

    const renderItem = useCallback(({ item }: { item: SearchResult }) => (
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

    return (
        <View style={styles.container}>
            <BrandAura style={styles.aura} />

            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <Text style={styles.eyebrow}>Descubre</Text>
                <Text style={styles.title}>Buscar juegos</Text>

                <View style={[styles.searchBox, focused && styles.searchBoxFocused]}>
                    <Feather name="search" size={18} color={focused ? colors.primary : colors.textTertiary} />
                    <TextInput
                        ref={inputRef}
                        style={styles.searchInput}
                        placeholder="Título, saga, estudio…"
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

            {vm.errorMessage ? (
                <ErrorMessage message={vm.errorMessage} onRetry={() => vm.search(input, userId)} />
            ) : vm.isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : input.trim().length === 0 ? (
                <View style={styles.center}>
                    <EmptyState
                        message="Empieza a escribir para buscar entre miles de juegos."
                        icon="search"
                    />
                </View>
            ) : vm.results.length === 0 ? (
                <View style={styles.center}>
                    <EmptyState message={`Sin resultados para "${input}".`} icon="frown" />
                </View>
            ) : (
                <FlatList
                    data={vm.results}
                    keyExtractor={(item) => item.getId()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                    keyboardShouldPersistTaps="handled"
                    initialNumToRender={10}
                    maxToRenderPerBatch={6}
                    windowSize={5}
                />
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
    },
    eyebrow: { ...typography.label, color: colors.secondary },
    title: { ...typography.largeTitle, marginTop: 2, marginBottom: spacing.lg },
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
    list: { paddingHorizontal: spacing.lg, paddingBottom: 100, paddingTop: spacing.sm },
});
