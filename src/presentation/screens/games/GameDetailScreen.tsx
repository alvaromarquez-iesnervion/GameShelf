import React, { useCallback, useEffect } from 'react';
import {
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { observer } from 'mobx-react-lite';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useInjection } from '../../../di/hooks/useInjection';
import { TYPES } from '../../../di/types';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { GameDetailViewModel } from '../../viewmodels/GameDetailViewModel';
import { WishlistViewModel } from '../../viewmodels/WishlistViewModel';
import { LibraryStackParamList } from '../../../core/navigation/navigationTypes';
import { ProtonDbBadge } from '../../components/games/ProtonDbBadge';
import { HltbInfo } from '../../components/games/HltbInfo';
import { DealCard } from '../../components/games/DealCard';
import { PlatformBadge } from '../../components/platforms/PlatformBadge';
import { DetailSkeleton } from '../../components/common/DetailSkeleton';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Platform as GamePlatform } from '../../../domain/enums/Platform';
import { WishlistItem } from '../../../domain/entities/WishlistItem';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

type Route = RouteProp<LibraryStackParamList, 'GameDetail'>;
type Nav = NativeStackNavigationProp<LibraryStackParamList, 'GameDetail'>;

export const GameDetailScreen: React.FC = observer(() => {
    const route = useRoute<Route>();
    const navigation = useNavigation<Nav>();
    const insets = useSafeAreaInsets();

    const { gameId, steamAppId, platforms: navPlatforms } = route.params;

    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<GameDetailViewModel>(TYPES.GameDetailViewModel);
    const wishlistVm = useInjection<WishlistViewModel>(TYPES.WishlistViewModel);

    const userId = authVm.currentUser?.getId() ?? '';
    const platformHint = navPlatforms?.find((p) => p !== GamePlatform.UNKNOWN) ?? null;

    useEffect(() => {
        if (userId) vm.loadGameDetail(gameId, userId, steamAppId, platformHint);
        return () => vm.clear();
    }, [gameId, userId, steamAppId, platformHint, vm]);

    const handleRetry = useCallback(() => {
        if (userId) vm.loadGameDetail(gameId, userId, steamAppId, platformHint);
    }, [gameId, userId, steamAppId, platformHint, vm]);

    const toggleWishlist = useCallback(async () => {
        if (!vm.gameDetail || !userId) return;
        const game = vm.gameDetail.detail.getGame();
        const inWl = wishlistVm.isGameInWishlist(game.getId());
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (inWl) {
            const item = wishlistVm.items.find((i) => i.getGameId() === game.getId());
            if (item) await wishlistVm.removeFromWishlist(userId, item.getId());
        } else {
            const wlPlatform = steamAppId != null ? GamePlatform.STEAM : null;
            await wishlistVm.addToWishlist(
                userId,
                new WishlistItem(
                    Date.now().toString(),
                    game.getId(),
                    game.getTitle(),
                    game.getCoverUrl(),
                    new Date(),
                    null,
                    wlPlatform,
                    steamAppId ?? null,
                ),
            );
        }
    }, [vm.gameDetail, wishlistVm, userId, steamAppId]);

    if (vm.isLoading) return <DetailSkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={handleRetry} />;
    if (!vm.gameDetail) return <DetailSkeleton />;

    const detail = vm.gameDetail.detail;
    const game = detail.getGame();
    const isOwned = detail.getIsInLibrary();
    const playtimeMinutes = game.getPlaytime();
    const inWishlist = wishlistVm.isGameInWishlist(game.getId());
    const steamMeta = detail.getSteamMetadata();
    const deals = detail.getDeals();
    const dlcs = detail.getOwnedDlcs();
    const displayPlatforms =
        navPlatforms && navPlatforms.length > 0 ? navPlatforms : [game.getPlatform()];

    const heroUri = game.getPortraitCoverUrl() && game.getPortraitCoverUrl() !== ''
        ? game.getPortraitCoverUrl()
        : game.getCoverUrl();

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            >
                <View style={styles.heroWrap}>
                    <Image source={{ uri: heroUri }} style={styles.hero} contentFit="cover" transition={300} />
                    <LinearGradient
                        colors={['rgba(7,8,12,0.55)', 'rgba(7,8,12,0)', 'rgba(7,8,12,0.85)', colors.background]}
                        style={styles.heroGradient}
                    />
                </View>

                <View style={styles.body}>
                    <Text style={styles.title}>{game.getTitle()}</Text>

                    <View style={styles.metaRow}>
                        {displayPlatforms.map((p) => (
                            <PlatformBadge key={p} platform={p} />
                        ))}
                        {isOwned && (
                            <View style={[styles.pill, { backgroundColor: colors.successBackground }]}>
                                <Feather name="check" size={12} color={colors.success} />
                                <Text style={[styles.pillText, { color: colors.success }]}>En tu biblioteca</Text>
                            </View>
                        )}
                        {inWishlist && (
                            <View style={[styles.pill, { backgroundColor: colors.primaryDim }]}>
                                <Ionicons name="heart" size={12} color={colors.primary} />
                                <Text style={[styles.pillText, { color: colors.primary }]}>Wishlist</Text>
                            </View>
                        )}
                    </View>

                    {steamMeta && (steamMeta.developers.length > 0 || steamMeta.releaseDate) && (
                        <View style={styles.infoCard}>
                            {steamMeta.developers.length > 0 && (
                                <InfoRow label="Desarrollador" value={steamMeta.developers.join(', ')} />
                            )}
                            {steamMeta.publishers.length > 0 && (
                                <InfoRow label="Editor" value={steamMeta.publishers.join(', ')} />
                            )}
                            {steamMeta.releaseDate && (
                                <InfoRow label="Lanzamiento" value={steamMeta.releaseDate} />
                            )}
                            {steamMeta.metacriticScore != null && (
                                <InfoRow label="Metacritic" value={`${steamMeta.metacriticScore} / 100`} />
                            )}
                        </View>
                    )}

                    {steamMeta && steamMeta.genres.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Géneros</Text>
                            <View style={styles.tagWrap}>
                                {steamMeta.genres.map((g) => (
                                    <View key={g} style={styles.tag}>
                                        <Text style={styles.tagText}>{g}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {detail.getProtonDbRating() && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Compatibilidad Linux</Text>
                            <ProtonDbBadge rating={detail.getProtonDbRating()!} />
                        </View>
                    )}

                    {isOwned && playtimeMinutes > 0 && (
                        <View style={styles.infoCard}>
                            <InfoRow label="Tu tiempo jugado" value={formatPlaytime(playtimeMinutes)} />
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Tiempo de juego</Text>
                        <HltbInfo
                            main={detail.getHowLongToBeatMain()}
                            mainExtra={detail.getHowLongToBeatMainExtra()}
                            completionist={detail.getHowLongToBeatCompletionist()}
                        />
                    </View>

                    {deals.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mejores ofertas</Text>
                            <View style={{ gap: spacing.sm }}>
                                {deals.slice(0, 6).map((d) => (
                                    <DealCard
                                        key={d.getId()}
                                        storeName={d.getStoreName()}
                                        price={d.getPrice()}
                                        originalPrice={d.getOriginalPrice()}
                                        discountPercentage={d.getDiscountPercentage()}
                                        url={d.getUrl()}
                                        currency={d.getCurrency()}
                                        onPress={() => Linking.openURL(d.getUrl())}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {dlcs.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>DLCs en tu biblioteca</Text>
                            <View style={{ gap: spacing.sm }}>
                                {dlcs.map((dlc) => (
                                    <View key={dlc.getId()} style={styles.dlcRow}>
                                        <Image source={{ uri: dlc.getCoverUrl() }} style={styles.dlcImg} contentFit="cover" />
                                        <Text style={styles.dlcTitle} numberOfLines={2}>{dlc.getTitle()}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.floatingChrome, { paddingTop: insets.top + spacing.sm }]}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => [styles.chromeBtn, pressed && { opacity: 0.7 }]}
                    hitSlop={10}
                    accessibilityLabel="Volver"
                >
                    <Feather name="chevron-left" size={22} color={colors.textPrimary} />
                </Pressable>
                <Pressable
                    onPress={toggleWishlist}
                    style={({ pressed }) => [
                        styles.chromeBtn,
                        inWishlist && styles.chromeBtnActive,
                        pressed && { opacity: 0.7 },
                    ]}
                    hitSlop={10}
                    accessibilityLabel={inWishlist ? 'Quitar de wishlist' : 'Añadir a wishlist'}
                >
                    <Ionicons
                        name={inWishlist ? 'heart' : 'heart-outline'}
                        size={22}
                        color={inWishlist ? colors.accentWarm : colors.textPrimary}
                    />
                </Pressable>
            </View>
        </View>
    );
});

function formatPlaytime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const min = minutes % 60;
    if (h === 0) return `${min} min`;
    if (min === 0) return `${h} h`;
    return `${h} h ${min} min`;
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    heroWrap: {
        width: '100%',
        height: 460,
        backgroundColor: colors.surface,
    },
    hero: { ...StyleSheet.absoluteFillObject },
    heroGradient: { ...StyleSheet.absoluteFillObject },
    floatingChrome: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
    },
    chromeBtn: {
        width: 44, height: 44,
        borderRadius: radius.full,
        backgroundColor: 'rgba(7,8,12,0.55)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    chromeBtnActive: {
        backgroundColor: colors.primaryDim,
        borderColor: colors.primaryBorder,
    },
    body: {
        marginTop: -spacing.xxl,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl,
        gap: spacing.lg,
    },
    title: { ...typography.heading, fontSize: 30, lineHeight: 34 },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.full,
    },
    pillText: { ...typography.caption, fontWeight: '600' },
    infoCard: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        gap: spacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    infoLabel: { ...typography.bodySecondary, color: colors.textTertiary, flexShrink: 0 },
    infoValue: { ...typography.bodySecondary, color: colors.textPrimary, flex: 1, textAlign: 'right' },
    section: { gap: spacing.sm },
    sectionTitle: { ...typography.title, fontSize: 18 },
    tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    tag: {
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.full,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    tagText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    dlcRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
    },
    dlcImg: {
        width: 60, height: 60,
        borderRadius: radius.sm,
        backgroundColor: colors.surfaceVariant,
    },
    dlcTitle: { ...typography.bodySecondary, color: colors.textPrimary, flex: 1 },
});
