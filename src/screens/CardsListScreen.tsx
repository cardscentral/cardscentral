import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoyaltyCard, RootStackParamList } from '../types';
import { getAllCards } from '../storage/cardStorage';
import { getShopById } from '../config/shops';
import { CardListItem } from '../components/CardListItem';
import { ShopIcon } from '../components/ShopIcon';
import { useI18n } from '../i18n/I18nContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ViewMode = 'list' | 'grid';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_COLUMNS = 3;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - 48) / GRID_COLUMNS;

export function CardsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useI18n();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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
        style={styles.gridItem}
        onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}
        activeOpacity={0.7}
        testID={`card-grid-item-${item.id}`}
      >
        <ShopIcon brand={shop.brand} shopId={shop.id} name={shop.name} size={56} />
        <Text style={styles.gridItemName} numberOfLines={2}>
          {shop.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏷️</Text>
      <Text style={styles.emptyTitle}>{t('noCardsYet')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('noCardsSubtitle')}
      </Text>
    </View>
  );

  const renderViewToggle = () => {
    if (cards.length === 0) return null;
    return (
      <View style={styles.toggleContainer} testID="view-toggle">
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => setViewMode('list')}
          testID="view-toggle-list"
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'grid' && styles.toggleButtonActive]}
          onPress={() => setViewMode('grid')}
          testID="view-toggle-grid"
        >
          <Text style={[styles.toggleText, viewMode === 'grid' && styles.toggleTextActive]}>⊞</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container} testID="cards-list-screen">
      {renderViewToggle()}
      <FlatList
        key={viewMode}
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={viewMode === 'list' ? renderListItem : renderGridItem}
        numColumns={viewMode === 'grid' ? GRID_COLUMNS : 1}
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
    width: GRID_ITEM_SIZE,
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
