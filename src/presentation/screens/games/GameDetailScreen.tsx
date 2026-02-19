import React, { useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
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
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { DetailSkeleton } from '../../components/common/DetailSkeleton';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const { width } = Dimensions.get('window');
const COVER_HEIGHT = 450;

type Route = RouteProp<LibraryStackParamList, 'GameDetail'>;

export const GameDetailScreen: React.FC = observer(() => {
    const route = useRoute<Route>();
    const { gameId } = route.params;
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<GameDetailViewModel>(TYPES.GameDetailViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId) vm.loadGameDetail(gameId, userId);
        return () => vm.clear();
    }, [gameId, userId]);

    if (vm.isLoading) return <DetailSkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={() => vm.loadGameDetail(gameId, userId)} />;
    if (!vm.gameDetail) return null;

    const detail = vm.gameDetail.detail;
    const game = detail.getGame();
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
                    
                    <View style={styles.metaRow}>
                        <PlatformBadge platform={game.getPlatform()} />
                        <ProtonDbBadge rating={detail.getProtonDbRating()} />
                    </View>

                    <Text style={styles.description} numberOfLines={5}>
                        {game.getDescription()}
                    </Text>

                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={[styles.wishlistBtn, isInWishlist && styles.wishlistBtnActive]} 
                            onPress={toggleWishlist}
                            activeOpacity={0.7}
                        >
                            <Feather 
                                name={isInWishlist ? 'heart' : 'heart'} 
                                size={20} 
                                color={isInWishlist ? colors.error : colors.onPrimary} 
                            />
                            <Text style={[styles.wishlistBtnText, isInWishlist && styles.wishlistBtnTextActive]}>
                                {isInWishlist ? 'En Wishlist' : 'Añadir a Wishlist'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <HltbInfo
                            main={detail.getHowLongToBeatMain()}
                            mainExtra={detail.getHowLongToBeatMainExtra()}
                            completionist={detail.getHowLongToBeatCompletionist()}
                        />
                    </View>

                    {detail.getDeals().length > 0 && (
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

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    coverContainer: {
        width: width,
        height: COVER_HEIGHT,
        position: 'relative',
    },
    cover: { 
        width: '100%', 
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: COVER_HEIGHT * 0.7,
    },
    content: { 
        paddingHorizontal: spacing.lg,
        marginTop: -COVER_HEIGHT * 0.15,
        paddingBottom: 100,
    },
    title: { 
        ...typography.heading, 
        color: colors.textPrimary,
        marginBottom: spacing.sm,
    },
    metaRow: { 
        flexDirection: 'row', 
        gap: spacing.sm, 
        marginBottom: spacing.lg,
        alignItems: 'center',
    },
    description: { 
        ...typography.bodySecondary, 
        marginBottom: spacing.xl,
        lineHeight: 24,
    },
    actionRow: {
        marginBottom: spacing.xl,
    },
    wishlistBtn: { 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary, 
        paddingVertical: spacing.md, 
        borderRadius: radius.lg, 
        gap: spacing.sm,
    },
    wishlistBtnActive: { 
        backgroundColor: colors.surfaceVariant,
    },
    wishlistBtnText: { 
        color: colors.onPrimary, 
        ...typography.button,
    },
    wishlistBtnTextActive: {
        color: colors.textPrimary,
    },
    section: {
        marginBottom: spacing.xl,
    },
    dealsSection: { 
        marginTop: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    sectionTitle: { 
        ...typography.title,
        color: colors.textPrimary,
    },
});
