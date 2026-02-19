import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Platform } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { TYPES } from '../../../di/types';
import { WishlistStackParamList } from '../../../core/navigation/navigationTypes';
import { WishlistGameCard } from '../../components/games/WishlistGameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { ListSkeleton } from '../../components/common/ListItemSkeleton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Nav = NativeStackNavigationProp<WishlistStackParamList, 'Wishlist'>;

const HEADER_TOP = Platform.OS === 'ios' ? 100 : 64;

export const WishlistScreen: React.FC = observer(() => {
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId) vm.loadWishlist(userId);
    }, [userId]);

    if (vm.isLoading && vm.items.length === 0) return <ListSkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={() => vm.loadWishlist(userId)} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={vm.items}
                keyExtractor={(item) => item.getId()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isLoading}
                        onRefresh={() => vm.loadWishlist(userId)}
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
                renderItem={({ item }) => (
                    <WishlistGameCard
                        coverUrl={item.getCoverUrl()}
                        title={item.getTitle()}
                        discountPercentage={item.getBestDealPercentage()}
                        onPress={() => navigation.navigate('GameDetail', { gameId: item.getGameId() })}
                        onRemove={() => vm.removeFromWishlist(userId, item.getId())}
                    />
                )}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        paddingTop: HEADER_TOP,
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        marginBottom: spacing.sm,
    },
    title: {
        fontSize: 34,
        fontWeight: '700',
        color: colors.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        letterSpacing: 0.37,
    },
    count: {
        ...typography.bodySecondary,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
});
