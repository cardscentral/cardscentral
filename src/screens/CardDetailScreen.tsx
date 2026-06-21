import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoyaltyCard, RootStackParamList } from '../types';
import { getCardById, deleteCard } from '../storage/cardStorage';
import { getShopById } from '../config/shops';
import { ShopIcon } from '../components/ShopIcon';
import { BarcodeDisplay } from '../components/BarcodeDisplay';

type CardDetailRouteProp = RouteProp<RootStackParamList, 'CardDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CardDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CardDetailRouteProp>();
  const { cardId } = route.params;

  const [card, setCard] = useState<LoyaltyCard | undefined>();

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = async () => {
    const loaded = await getCardById(cardId);
    setCard(loaded);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCard(cardId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const shop = getShopById(card.shopId);
  if (!shop) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Shop not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="card-detail-screen">
      {/* Card Header with Shop Branding */}
      <View style={[styles.cardHeader, { backgroundColor: shop.brand.primary_color }]}>
        <ShopIcon brand={shop.brand} size={64} />
        <Text style={[styles.shopName, { color: shop.brand.text_color }]}>
          {shop.name}
        </Text>
        {card.nickname && (
          <Text style={[styles.nickname, { color: shop.brand.text_color }]}>
            {card.nickname}
          </Text>
        )}
      </View>

      {/* Barcode Section */}
      <View style={styles.barcodeSection}>
        <BarcodeDisplay
          value={card.cardNumber}
          type={shop.barcode_type}
          width={300}
          height={120}
        />
      </View>

      {/* Card Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Card Number</Text>
          <Text style={styles.infoValue}>{card.cardNumber}</Text>
        </View>
        {card.nickname && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nickname</Text>
            <Text style={styles.infoValue}>{card.nickname}</Text>
          </View>
        )}
        {card.notes && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Notes</Text>
            <Text style={styles.infoValue}>{card.notes}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Added</Text>
          <Text style={styles.infoValue}>
            {new Date(card.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {card.sharedBy && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Shared by</Text>
            <Text style={styles.infoValue} testID="shared-by-value">
              {card.sharedBy}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {card.sharedBy ? (
        // Shared cards are read-only: no edit. Users can still remove the copy
        // from their own wallet, but cannot modify a card someone shared.
        <View style={styles.actions} testID="shared-card-actions">
          <View style={styles.sharedBanner}>
            <Text style={styles.sharedBannerText}>
              This card was shared with you and is read-only.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            testID="remove-shared-card-button"
          >
            <Text style={styles.deleteButtonText}>Remove from My Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditCard', { cardId: card.id })}
            testID="edit-card-button"
          >
            <Text style={styles.editButtonText}>Edit Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            testID="delete-card-button"
          >
            <Text style={styles.deleteButtonText}>Delete Card</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    paddingBottom: 32,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
    color: '#666',
  },
  cardHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  shopName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  nickname: {
    fontSize: 16,
    marginTop: 4,
    opacity: 0.8,
  },
  barcodeSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: -16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoSection: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  actions: {
    marginTop: 24,
    marginHorizontal: 16,
    gap: 12,
  },
  sharedBanner: {
    backgroundColor: '#EAF3FF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#B9D8FF',
  },
  sharedBannerText: {
    color: '#0A5BBF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
