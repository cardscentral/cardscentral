import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoyaltyCard, RootStackParamList } from '../types';
import { getAllCards } from '../storage/cardStorage';
import { getShopById } from '../config/shops';
import { CardListItem } from '../components/CardListItem';
import { ShopIcon } from '../components/ShopIcon';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { getViewMode, setViewMode as persistViewMode } from '../storage/preferences';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ViewMode = 'list' | 'grid';


// Grid sizing is derived from the live window width so the layout reflows when
// the browser window is resized (useWindowDimensions re-renders on resize, incl.
// on web). Wider viewports get more columns; each tile targets ~110px.
const GRID_TILE_TARGET = 110; // px, ideal tile width before gaps
const GRID_MIN_COLUMNS = 3;
const GRID_MAX_COLUMNS = 8;
const GRID_H_PADDING = 16; // matches list horizontal padding

function getGridLayout(width: number) {
  const usable = Math.max(0, width - GRID_H_PADDING * 2);
  const columns = Math.min(
    GRID_MAX_COLUMNS,
    Math.max(GRID_MIN_COLUMNS, Math.floor(usable / GRID_TILE_TARGET))
  );
  // Each tile has 4px horizontal margin on both sides (see styles.gridItem).
  const itemSize = usable / columns - 8;
  return { columns, itemSize };
}

export function CardsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { columns: gridColumns, itemSize: gridItemSize } = getGridLayout(width);
  const [cards, setCards] = useState<LoyaltyCard[]>([]);


  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Restore the user's last-used layout on mount so the choice survives reloads
  // and app restarts (persisted via AsyncStorage / localStorage on web).
  useEffect(() => {
    getViewMode().then((stored) => {
      if (stored) setViewMode(stored);
    });
  }, []);

  // Update the layout and remember it for next time.
  const changeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    persistViewMode(mode);
  }, []);

  const loadCards = useCallback(async () => {
    const storedCards = await getAllCards();
    setCards(storedCards);
  }, []);


  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCards();
    setRefreshing(false);
  }, [loadCards]);

  const renderListItem = ({ item }: { item: LoyaltyCard }) => {
    const shop = getShopById(item.shopId);
    if (!shop) return null;

    return (
      <CardListItem
        card={item}
        shop={shop}
        onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}
      />
    );
  };

  const renderGridItem = ({ item }: { item: LoyaltyCard }) => {
    const shop = getShopById(item.shopId);
    if (!shop) return null;

    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: gridItemSize, backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}

        activeOpacity={0.7}
        testID={`card-grid-item-${item.id}`}
      >
        <ShopIcon brand={shop.brand} shopId={shop.id} name={shop.name} size={56} />
        <Text style={[styles.gridItemName, { color: colors.text }]} numberOfLines={2}>
          {shop.name}
        </Text>
      </TouchableOpacity>

    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer} testID="empty-state">
      <Text style={styles.emptyIcon}>🏷️</Text>

      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('noCardsYet')}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        {t('noCardsSubtitle')}
      </Text>
    </View>
  );

  const renderViewToggle = () => {
    if (cards.length === 0) return null;
    return (
      <View style={styles.toggleContainer} testID="view-toggle">
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: colors.controlBackground },
            viewMode === 'list' && { backgroundColor: colors.primary },
          ]}
          onPress={() => changeViewMode('list')}
          testID="view-toggle-list"
        >
          <Text
            style={[
              styles.toggleText,
              { color: colors.textMuted },
              viewMode === 'list' && { color: colors.onPrimary },
            ]}
          >
            ☰
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: colors.controlBackground },
            viewMode === 'grid' && { backgroundColor: colors.primary },
          ]}
          onPress={() => changeViewMode('grid')}
          testID="view-toggle-grid"
        >
          <Text
            style={[
              styles.toggleText,
              { color: colors.textMuted },
              viewMode === 'grid' && { color: colors.onPrimary },
            ]}
          >
            ⊞
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="cards-list-screen">

      {renderViewToggle()}
      <FlatList
        // FlatList must remount when numColumns changes, so key on both the
        // view mode and the (resize-driven) column count.
        key={viewMode === 'grid' ? `grid-${gridColumns}` : 'list'}
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === 'list' ? renderListItem : renderGridItem}
        numColumns={viewMode === 'grid' ? gridColumns : 1}

        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={cards.length === 0 ? styles.emptyList : styles.list}
        testID="cards-list"
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCard', {})}
        testID="add-card-button"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 18,
    color: '#666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingVertical: 12,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  gridItem: {
    // width is applied inline (responsive to window size)
    alignItems: 'center',

    padding: 12,
    marginHorizontal: 4,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  gridItemName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '400',
    marginTop: -2,
  },
});
