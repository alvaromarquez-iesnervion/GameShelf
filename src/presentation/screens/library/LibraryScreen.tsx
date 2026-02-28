import React, { useEffect, useCallback } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, RefreshControl, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useInjection } from '../../../di/hooks/useInjection';
import { AuthViewModel } from '../../viewmodels/AuthViewModel';
import { LibraryViewModel } from '../../viewmodels/LibraryViewModel';
import { TYPES } from '../../../di/types';
import { LibraryStackParamList } from '../../../core/navigation/navigationTypes';
import { GameCard } from '../../components/games/GameCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { LibrarySkeleton } from '../../components/common/LibrarySkeleton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { styles } from './LibraryScreen.styles';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'Library'>;

// Constantes para getItemLayout (grid 3 columnas)
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const HORIZONTAL_PADDING = spacing.lg * 2; // padding left + right del contenedor
const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - (spacing.lg * (NUM_COLUMNS - 1))) / NUM_COLUMNS;
const ITEM_HEIGHT = ITEM_WIDTH * (3 / 2) + 28; // aspect 2:3 + título (~24px text + 4px margin)
const ROW_MARGIN = spacing.lg;

export const LibraryScreen: React.FC = observer(() => {
    const insets = useSafeAreaInsets();
    const authVm = useInjection<AuthViewModel>(TYPES.AuthViewModel);
    const vm = useInjection<LibraryViewModel>(TYPES.LibraryViewModel);
    const navigation = useNavigation<Nav>();
    const userId = authVm.currentUser?.getId() ?? '';

    useEffect(() => {
        if (userId) vm.loadLibrary(userId);
    }, [userId, vm]);

    const handleRefresh = useCallback(() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        vm.loadLibrary(userId);
    }, [vm, userId]);

    const handleNavigateWishlist = useCallback(() => {
        (navigation as any).navigate('WishlistStack');
    }, [navigation]);

    const handleGamePress = useCallback((gameId: string) => {
        navigation.navigate('GameDetail', { gameId });
    }, [navigation]);

    const handleSearchChange = useCallback((query: string) => {
        vm.setSearchQuery(query);
    }, [vm]);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.actionCircle}
                        onPress={handleRefresh}
                    >
                        <Feather name="rotate-cw" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionCircle}
                        onPress={handleNavigateWishlist}
                    >
                        <Feather name="heart" size={18} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, handleRefresh, handleNavigateWishlist]);

    if (vm.isLoading && vm.games.length === 0) return <LibrarySkeleton />;
    if (vm.errorMessage) return <ErrorMessage message={vm.errorMessage} onRetry={handleRefresh} />;

    return (
        <View style={styles.container}>
            <FlatList
                data={vm.filteredGames}
                keyExtractor={(item) => item.getId()}
                numColumns={3}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.list}
                initialNumToRender={12}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews={true}
                getItemLayout={(data, index) => {
                    const row = Math.floor(index / NUM_COLUMNS);
                    return {
                        length: ITEM_HEIGHT,
                        offset: row * (ITEM_HEIGHT + ROW_MARGIN),
                        index,
                    };
                }}
                ListHeaderComponent={
                    <View style={[styles.header, { paddingTop: insets.top + 44 }]}>
                        <Text style={styles.largeTitle}>Mi Biblioteca</Text>
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={16} color={colors.textTertiary} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar en la colección"
                                placeholderTextColor={colors.textTertiary}
                                value={vm.searchQuery}
                                onChangeText={handleSearchChange}
                                clearButtonMode="while-editing"
                                selectionColor={colors.primary}
                            />
                        </View>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isLoading}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                renderItem={({ item }) => (
                    <GameCard
                        coverUrl={item.getCoverUrl()}
                        portraitCoverUrl={item.getPortraitCoverUrl()}
                        title={item.getTitle()}
                        platform={item.getPlatform()}
                        onPress={() => handleGamePress(item.getId())}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <EmptyState
                            message="Tu colección está esperando. Vincula una plataforma para importar tus juegos."
                            icon="plus-circle"
                        />
                    </View>
                }
            />
        </View>
    );
});
