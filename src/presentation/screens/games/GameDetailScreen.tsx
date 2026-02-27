import React, { useEffect, useRef, useState } from 'react';
import {
    View, ScrollView, FlatList, Text, TouchableOpacity,
    Platform, NativeSyntheticEvent, NativeScrollEvent, ViewToken,
} from 'react-native';
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
import { SteamGameMetadata } from '../../../domain/dtos/SteamGameMetadata';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import {
    styles, SLIDE_WIDTH, COVER_HEIGHT, SCREENSHOT_HEIGHT,
} from './GameDetailScreen.styles';

type Route = RouteProp<LibraryStackParamList, 'GameDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPlaytime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours.toLocaleString()}h`;
}

function formatLastPlayed(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 30) return `Hace ${days} días`;
    if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
    return `Hace ${Math.floor(days / 365)} años`;
}

function formatRecommendations(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
    return count.toLocaleString();
}

function metacriticColor(score: number): string {
    if (score >= 75) return '#66CC33';
    if (score >= 50) return '#FFCC33';
    return '#FF0000';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CarouselProps {
    coverUrl: string;
    screenshots: string[];
}

const MediaCarousel = React.memo(({ coverUrl, screenshots }: CarouselProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const slides = [coverUrl, ...screenshots.slice(0, 9)];
    const isCover = activeIndex === 0;
    const slideHeight = isCover ? COVER_HEIGHT : SCREENSHOT_HEIGHT;

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                setActiveIndex(viewableItems[0].index);
            }
        },
    ).current;

    return (
        <View style={styles.carouselContainer}>
            <FlatList
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                renderItem={({ item, index }) => (
                    <View style={[styles.slide, index === 0 ? styles.coverSlide : styles.screenshotSlide]}>
                        <Image
                            source={{ uri: item }}
                            style={[styles.slideImage, { height: index === 0 ? COVER_HEIGHT : SCREENSHOT_HEIGHT }]}
                            contentFit={index === 0 ? 'fill' : 'cover'}
                            transition={300}
                        />
                    </View>
                )}
            />
            {isCover && (
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.5)', colors.background]}
                    style={styles.carouselGradient}
                />
            )}
            {slides.length > 1 && (
                <View style={styles.paginationRow}>
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            style={[styles.dot, i === activeIndex && styles.dotActive]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
});

interface InfoRowProps { label: string; value: string }
const InfoRow = ({ label, value }: InfoRowProps) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

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
    const steamMeta: SteamGameMetadata | null = detail.getSteamMetadata();

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

    const playtime = game.getPlaytime();
    const lastPlayed = game.getLastPlayed();
    const showPlayerStats = isOwned && (playtime > 0 || lastPlayed !== null);

    const protonRating = detail.getProtonDbRating();
    const protonTrending = detail.getProtonDbTrendingRating();
    const protonReports = detail.getProtonDbReportCount();
    const showProtonSection = protonRating !== null || protonTrending !== null;

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="never"
            >
                {/* ── Carousel: cover + screenshots ── */}
                <MediaCarousel
                    coverUrl={game.getCoverUrl()}
                    screenshots={steamMeta?.screenshots ?? []}
                />

                {/* ── Main content ── */}
                <View style={styles.content}>
                    <Text style={styles.title}>{game.getTitle()}</Text>

                    {/* Platform badge + Metacritic score on same row */}
                    <View style={styles.metaRow}>
                        <PlatformBadge platform={game.getPlatform()} />
                        {steamMeta?.metacriticScore !== null && steamMeta?.metacriticScore !== undefined && (
                            <View style={[
                                styles.metacriticBadge,
                                { backgroundColor: metacriticColor(steamMeta.metacriticScore) },
                            ]}>
                                <Text style={[styles.metacriticScore, { color: '#000' }]}>
                                    {steamMeta.metacriticScore}
                                </Text>
                            </View>
                        )}
                        {steamMeta?.recommendationCount !== null && steamMeta?.recommendationCount !== undefined && (
                            <View style={styles.recommendRow}>
                                <Feather name="thumbs-up" size={14} color={colors.success} />
                                <Text style={[styles.infoValue, { color: colors.success }]}>
                                    {formatRecommendations(steamMeta.recommendationCount)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Description */}
                    {game.getDescription() !== '' && (
                        <Text style={styles.description} numberOfLines={5}>
                            {game.getDescription()}
                        </Text>
                    )}

                    {/* Wishlist button (non-owned games only) */}
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

                    {/* ── Player stats (Steam playtime / last played) ── */}
                    {showPlayerStats && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Mis estadísticas</Text>
                                <Feather name="activity" size={18} color={colors.primary} />
                            </View>
                            <View style={styles.statsGrid}>
                                {playtime > 0 && (
                                    <View style={styles.statCard}>
                                        <Feather name="clock" size={20} color={colors.primary} />
                                        <Text style={styles.statValue}>{formatPlaytime(playtime)}</Text>
                                        <Text style={styles.statLabel}>Tiempo jugado</Text>
                                    </View>
                                )}
                                {lastPlayed !== null && (
                                    <View style={styles.statCard}>
                                        <Feather name="calendar" size={20} color={colors.secondary} />
                                        <Text style={styles.statValue}>{formatLastPlayed(lastPlayed)}</Text>
                                        <Text style={styles.statLabel}>Última sesión</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* ── ProtonDB compatibility ── */}
                    {showProtonSection && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Linux / Steam Deck</Text>
                                <Feather name="monitor" size={18} color={colors.textSecondary} />
                            </View>
                            <View style={styles.protonRow}>
                                <View style={styles.protonBadges}>
                                    <ProtonDbBadge rating={protonRating} />
                                    {protonTrending && protonTrending !== protonRating && (
                                        <>
                                            <Feather name="trending-up" size={14} color={colors.textSecondary} />
                                            <Text style={styles.protonTrendingLabel}>tendencia:</Text>
                                            <ProtonDbBadge rating={protonTrending} />
                                        </>
                                    )}
                                </View>
                                {protonReports !== null && (
                                    <Text style={styles.protonReports}>
                                        {protonReports.toLocaleString()} reports
                                    </Text>
                                )}
                            </View>
                        </View>
                    )}

                    {/* ── HLTB ── */}
                    <View style={styles.section}>
                        <HltbInfo
                            main={detail.getHowLongToBeatMain()}
                            mainExtra={detail.getHowLongToBeatMainExtra()}
                            completionist={detail.getHowLongToBeatCompletionist()}
                        />
                    </View>

                    {/* ── Game info (Steam metadata) ── */}
                    {steamMeta && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Información</Text>
                                <Feather name="info" size={18} color={colors.textSecondary} />
                            </View>
                            <View style={styles.infoGrid}>
                                {steamMeta.developers.length > 0 && (
                                    <InfoRow label="Desarrollador" value={steamMeta.developers.join(', ')} />
                                )}
                                {steamMeta.publishers.length > 0 && (
                                    <InfoRow label="Publisher" value={steamMeta.publishers.join(', ')} />
                                )}
                                {steamMeta.releaseDate && (
                                    <InfoRow label="Lanzamiento" value={steamMeta.releaseDate} />
                                )}
                            </View>
                            {steamMeta.genres.length > 0 && (
                                <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
                                    <Text style={styles.infoLabel}>Géneros</Text>
                                    <View style={styles.genreRow}>
                                        {steamMeta.genres.map(g => (
                                            <View key={g} style={styles.genreChip}>
                                                <Text style={styles.genreChipText}>{g}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {/* ── Deals ── */}
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
