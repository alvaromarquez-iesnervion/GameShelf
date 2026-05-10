import React, { useCallback, useEffect } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
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
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { WishlistStackParamList } from '../../../core/navigation/navigationTypes';
import { WishlistGameCard } from '../../components/games/WishlistGameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { LibrarySkeleton } from '../../components/common/LibrarySkeleton';
import { BrandAura } from '../../components/common/BrandAura';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<WishlistStackParamList, 'Wishlist'>;

export const WishlistScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId && vm.items.length === 0 && !vm.isLoading) {
            vm.loadWishlist(userId);
        }
    }, [userId, vm]);

    const onRefresh = useCallback(() => {
        if (userId) vm.loadWishlist(userId);
    }, [userId, vm]);

    const onPress = useCallback((item: WishlistItem) => {
        navigation.navigate('GameDetail', {
            gameId: item.getGameId(),
            steamAppId: item.getSteamAppId() ?? undefined,
            platforms: item.getPlatform() ? [item.getPlatform()!] : undefined,
        });
    }, [navigation]);

    const onRemove = useCallback(async (itemId: string) => {
        if (!userId) return;
        await vm.removeFromWishlist(userId, itemId);
    }, [userId, vm]);

    const renderItem = useCallback(({ item }: { item: WishlistItem }) => (
        <WishlistGameCard
            gameId={item.getGameId()}
            coverUrl={item.getCoverUrl()}
            title={item.getTitle()}
            discountPercentage={item.getBestDealPercentage()}
            platform={item.getPlatform()}
            steamAppId={item.getSteamAppId()}
            onPress={() => onPress(item)}
            onRemove={() => onRemove(item.getId())}
        />
    ), [onPress, onRemove]);

    if (vm.isLoading && vm.items.length === 0) return <LibrarySkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={onRefresh} />;

    return (
        <View style={styles.container}>
            <BrandAura style={styles.aura} />

            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <Pressable
                    style={({ pressed }) => [styles.back, pressed && { opacity: 0.7 }]}
                    onPress={() => navigation.goBack()}
                    hitSlop={12}
                >
                    <Feather name="chevron-left" size={22} color={colors.textPrimary} />
                </Pressable>
                <View style={styles.titleBlock}>
                    <Text style={styles.eyebrow}>Tu lista</Text>
                    <Text style={styles.title}>Wishlist</Text>
                    <Text style={styles.count}>
                        {vm.items.length} {vm.items.length === 1 ? 'juego guardado' : 'juegos guardados'}
                    </Text>
                </View>
            </View>

            <FlatList
                data={vm.items}
                keyExtractor={(it) => it.getId()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isLoading}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <EmptyState
                            message="Tu wishlist está vacía. Guarda juegos desde la búsqueda y te avisaremos de las ofertas."
                            icon="heart"
                        />
                    </View>
                }
                initialNumToRender={8}
                maxToRenderPerBatch={6}
                windowSize={5}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    aura: { position: 'absolute', top: 0, left: 0, right: 0, height: 200 },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.md,
    },
    back: {
        width: 40, height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: colors.borderSubtle,
        marginBottom: 4,
    },
    titleBlock: { flex: 1 },
    eyebrow: { ...typography.label, color: colors.secondary },
    title: { ...typography.largeTitle, marginTop: 2 },
    count: { ...typography.bodySecondary, marginTop: 2 },
    list: { paddingHorizontal: spacing.lg, paddingBottom: 100, paddingTop: spacing.sm },
    empty: { paddingTop: spacing.xxxl, paddingHorizontal: spacing.xl },
});
