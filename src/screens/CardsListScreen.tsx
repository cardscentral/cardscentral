import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoyaltyCard, RootStackParamList } from '../types';
import { getAllCards } from '../storage/cardStorage';
import { getShopById } from '../config/shops';
import { CardListItem } from '../components/CardListItem';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CardsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderItem = ({ item }: { item: LoyaltyCard }) => {
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💳</Text>
      <Text style={styles.emptyTitle}>No Cards Yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to add your first loyalty card
      </Text>
    </View>
  );

  return (
    <View style={styles.container} testID="cards-list-screen">
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
