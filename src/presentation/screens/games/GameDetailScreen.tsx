import React, { useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { GameDetailViewModel } from '../../viewmodels/GameDetailViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { TYPES } from '../../../di/types';
import { LibraryStackParamList } from '../../../core/navigation/navigationTypes';
import { ProtonDbBadge } from '../../components/games/ProtonDbBadge';
import { HltbInfo } from '../../components/games/HltbInfo';
import { DealCard } from '../../components/games/DealCard';
import { PlatformBadge } from '../../components/platforms/PlatformBadge';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DetailSkeleton } from '../../components/common/DetailSkeleton';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { colors } from '../../theme/colors';
import { styles, COVER_HEIGHT } from './GameDetailScreen.styles';

type Route = RouteProp<LibraryStackParamList, 'GameDetail'>;

export const GameDetailScreen: React.FC = observer(() => {
    const route = useRoute<Route>();
    const { gameId, steamAppId } = route.params;
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<GameDetailViewModel>(TYPES.GameDetailViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId) vm.loadGameDetail(gameId, userId, steamAppId);
        return () => vm.clear();
    }, [gameId, userId, steamAppId]);

    if (vm.isLoading) return <DetailSkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={() => vm.loadGameDetail(gameId, userId)} />;
    if (!vm.gameDetail) return null;

    const detail = vm.gameDetail.detail;
    const game = detail.getGame();
    const isOwned = game.getPlatform() !== GamePlatform.UNKNOWN;
    const isInWishlist = wishlistVm.isGameInWishlist(game.getId());

    const toggleWishlist = async () => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        if (isInWishlist) {
            const item = wishlistVm.items.find(i => i.getGameId() === game.getId());
            if (item) await wishlistVm.removeFromWishlist(userId, item.getId());
        } else {
            const newItem = new WishlistItem(
                Date.now().toString(), game.getId(), game.getTitle(),
                game.getCoverUrl(), new Date(), null,
            );
            await wishlistVm.addToWishlist(userId, newItem);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="never"
            >
                {/* Header Image with Gradient Overlay */}
                <View style={styles.coverContainer}>
                    <Image
                        source={{ uri: game.getCoverUrl() }}
                        style={styles.cover}
                        contentFit="cover"
                        transition={500}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.5)', colors.background]}
                        style={styles.gradient}
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>{game.getTitle()}</Text>

                    {(isOwned || detail.getProtonDbRating() !== null) && (
                        <View style={styles.metaRow}>
                            <PlatformBadge platform={game.getPlatform()} />
                            <ProtonDbBadge rating={detail.getProtonDbRating()} />
                        </View>
                    )}

                    <Text style={styles.description} numberOfLines={5}>
                        {game.getDescription()}
                    </Text>

                    {!isOwned && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.wishlistBtn, isInWishlist && styles.wishlistBtnActive]}
                                onPress={toggleWishlist}
                                activeOpacity={0.7}
                            >
                                <Feather
                                    name="heart"
                                    size={20}
                                    color={isInWishlist ? colors.error : colors.onPrimary}
                                />
                                <Text style={[styles.wishlistBtnText, isInWishlist && styles.wishlistBtnTextActive]}>
                                    {isInWishlist ? 'En Wishlist' : 'Añadir a Wishlist'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.section}>
                        <HltbInfo
                            main={detail.getHowLongToBeatMain()}
                            mainExtra={detail.getHowLongToBeatMainExtra()}
                            completionist={detail.getHowLongToBeatCompletionist()}
                        />
                    </View>

                    {!isOwned && detail.getDeals().length > 0 && (
                        <View style={styles.dealsSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Mejores Ofertas</Text>
                                <Feather name="trending-down" size={18} color={colors.success} />
                            </View>
                            {detail.getDeals().map(deal => (
                                <DealCard
                                    key={deal.getId()}
                                    storeName={deal.getStoreName()}
                                    price={deal.getPrice()}
                                    originalPrice={deal.getOriginalPrice()}
                                    discountPercentage={deal.getDiscountPercentage()}
                                    url={deal.getUrl()}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
});
