import React, { useEffect, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, ListRenderItemInfo } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { TYPES } from '../../../di/types';
import { WishlistStackParamList } from '../../../core/navigation/navigationTypes';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { WishlistGameCard } from '../../components/games/WishlistGameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { styles } from './WishlistScreen.styles';

type Nav = NativeStackNavigationProp<WishlistStackParamList, 'Wishlist'>;

// Constantes para getItemLayout
// WishlistGameCard: cover 96px height + marginBottom spacing.sm (8px) + borderWidth (~0.33px)
const ITEM_HEIGHT = 96 + StyleSheet.hairlineWidth * 2; // cover height + borders
const ITEM_MARGIN = spacing.sm; // marginBottom

export const WishlistScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId) vm.loadWishlist(userId);
    }, [userId, vm]);

    const handleRefresh = useCallback(() => {
        vm.loadWishlist(userId);
    }, [vm, userId]);

    const handleGamePress = useCallback((gameId: string) => {
        navigation.navigate('GameDetail', { gameId });
    }, [navigation]);

    const handleRemove = useCallback((itemId: string) => {
        vm.removeFromWishlist(userId, itemId);
    }, [vm, userId]);

    const renderWishlistCard = useCallback(({ item }: ListRenderItemInfo<WishlistItem>) => (
        <WishlistGameCard
            coverUrl={item.getCoverUrl()}
            title={item.getTitle()}
            discountPercentage={item.getBestDealPercentage()}
            onPress={() => handleGamePress(item.getGameId())}
            onRemove={() => handleRemove(item.getId())}
        />
    ), [handleGamePress, handleRemove]);

    if (vm.isLoading && vm.items.length === 0) return <ListSkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={handleRefresh} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={vm.items}
                keyExtractor={(item) => item.getId()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => ({
                    length: ITEM_HEIGHT + ITEM_MARGIN,
                    offset: index * (ITEM_HEIGHT + ITEM_MARGIN),
                    index,
                })}
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isLoading}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.title}>Lista de deseos</Text>
                        {vm.items.length > 0 && (
                            <Text style={styles.count}>{vm.items.length} {vm.items.length === 1 ? 'juego' : 'juegos'}</Text>
                        )}
                    </View>
                }
                renderItem={renderWishlistCard}
                ListEmptyComponent={
                    <EmptyState
                        message="Tu lista de deseos está vacía. Agrega juegos desde la búsqueda."
                        icon="heart"
                    />
                }
            />
        </View>
    );
});
