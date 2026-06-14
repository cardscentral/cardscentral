import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LoyaltyCard, RootStackParamList } from '../types';
import { getCardById, updateCard } from '../storage/cardStorage';
import { getShopById } from '../config/shops';
import { ShopIcon } from '../components/ShopIcon';

type EditCardRouteProp = RouteProp<RootStackParamList, 'EditCard'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function EditCardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditCardRouteProp>();
  const { cardId } = route.params;

  const [card, setCard] = useState<LoyaltyCard | undefined>();
  const [cardNumber, setCardNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = async () => {
    const loaded = await getCardById(cardId);
    if (loaded) {
      setCard(loaded);
      setCardNumber(loaded.cardNumber);
      setNickname(loaded.nickname || '');
      setNotes(loaded.notes || '');
    }
  };

  const handleSave = async () => {
    if (!card) return;
    if (!cardNumber.trim()) {
      Alert.alert('Error', 'Card number cannot be empty');
      return;
    }

    await updateCard({
      ...card,
      cardNumber: cardNumber.trim(),
      nickname: nickname.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    navigation.goBack();
  };

  if (!card) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const shop = getShopById(card.shopId);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Shop Info (read-only) */}
      {shop && (
        <View style={styles.shopInfo}>
          <ShopIcon brand={shop.brand} size={48} />
          <Text style={styles.shopName}>{shop.name}</Text>
        </View>
      )}

      {/* Card Number */}
      <Text style={styles.label}>Card Number</Text>
      <TextInput
        style={styles.input}
        value={cardNumber}
        onChangeText={setCardNumber}
        keyboardType="default"
        autoCapitalize="characters"
        testID="edit-card-number-input"
      />

      {/* Nickname */}
      <Text style={styles.label}>Nickname (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. My Card"
        value={nickname}
        onChangeText={setNickname}
        testID="edit-nickname-input"
      />

      {/* Notes */}
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Any additional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        testID="edit-notes-input"
      />

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        testID="save-edit-button"
      >
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
    color: '#666',
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#1a1a1a',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
