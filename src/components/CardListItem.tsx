import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LoyaltyCard, ShopConfig } from '../types';
import { ShopIcon } from './ShopIcon';

interface CardListItemProps {
  card: LoyaltyCard;
  shop: ShopConfig;
  onPress: () => void;
}

export function CardListItem({ card, shop, onPress }: CardListItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: shop.brand.primary_color }]}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`card-item-${card.id}`}
    >
      <ShopIcon brand={shop.brand} size={48} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.shopName}>{shop.name}</Text>
          {card.sharedBy && (
            <View style={styles.sharedBadge} testID={`card-shared-badge-${card.id}`}>
              <Text style={styles.sharedBadgeText}>Shared</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardNumber} numberOfLines={1}>
          {card.nickname || card.cardNumber}
        </Text>
        {card.nickname && (
          <Text style={styles.cardNumberSmall} numberOfLines={1}>
            {card.cardNumber}
          </Text>
        )}
      </View>
      <View style={styles.chevron}>
        <Text style={styles.chevronText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sharedBadge: {
    backgroundColor: '#EAF3FF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sharedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A5BBF',
    textTransform: 'uppercase',
  },

  cardNumber: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  cardNumberSmall: {
    fontSize: 11,
    color: '#999',
    marginTop: 1,
    fontFamily: 'monospace',
  },
  chevron: {
    paddingLeft: 8,
  },
  chevronText: {
    fontSize: 24,
    color: '#ccc',
    fontWeight: '300',
  },
});
