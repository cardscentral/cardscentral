import React, { useState, useEffect } from 'react';
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
import { v4 as uuidv4 } from 'uuid';
import { RootStackParamList, ShopConfig, ShopCategory } from '../types';
import { addCard } from '../storage/cardStorage';
import { getShopById, getShopsGroupedByCategory, CATEGORY_META } from '../config/shops';
import { getSelectedCountry } from '../storage/preferences';
import { ShopIcon } from '../components/ShopIcon';

type AddCardRouteProp = RouteProp<RootStackParamList, 'AddCard'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_ORDER: ShopCategory[] = [
  'groceries',
  'fashion',
  'electronics',
  'petrol',
  'pharmacy',
  'home',
  'sports',
  'other',
];

export function AddCardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddCardRouteProp>();
  const preselectedShopId = route.params?.shopId;

  const [selectedShop, setSelectedShop] = useState<ShopConfig | undefined>(
    preselectedShopId ? getShopById(preselectedShopId) : undefined
  );
  const [cardNumber, setCardNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState('');
  const [groupedShops, setGroupedShops] = useState<Partial<Record<ShopCategory, ShopConfig[]>>>({});

  useEffect(() => {
    getSelectedCountry().then((country) => {
      if (country) {
        setGroupedShops(getShopsGroupedByCategory(country));
      }
    });
  }, []);

  const handleScan = () => {
    navigation.navigate('ScanBarcode', { shopId: selectedShop?.id });
  };

  const handleSave = async () => {
    if (!selectedShop) {
      Alert.alert('Error', 'Please select a shop');
      return;
    }
    if (!cardNumber.trim()) {
      Alert.alert('Error', 'Please enter or scan a card number');
      return;
    }

    const now = new Date().toISOString();
    await addCard({
      id: uuidv4(),
      shopId: selectedShop.id,
      cardNumber: cardNumber.trim(),
      nickname: nickname.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Shop Selection grouped by category */}
      <Text style={styles.mainTitle}>Select Shop</Text>

      {CATEGORY_ORDER.map((category) => {
        const shops = groupedShops[category];
        if (!shops || shops.length === 0) return null;

        const meta = CATEGORY_META[category];

        return (
          <View key={category}>
            <Text style={styles.categoryTitle}>{meta.label}</Text>
            <View style={styles.shopGrid}>
              {shops.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  style={[
                    styles.shopItem,
                    selectedShop?.id === shop.id && styles.shopItemSelected,
                    selectedShop?.id === shop.id && {
                      borderColor: shop.brand.primary_color,
                    },
                  ]}
                  onPress={() => setSelectedShop(shop)}
                  testID={`shop-select-${shop.id}`}
                >
                  <ShopIcon brand={shop.brand} size={36} />
                  <Text style={styles.shopItemName} numberOfLines={2}>
                    {shop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      {/* Card Number Input */}
      <Text style={styles.sectionTitle}>Card Number</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter card number"
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="default"
          autoCapitalize="characters"
          testID="card-number-input"
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScan}
          testID="scan-barcode-button"
        >
          <Text style={styles.scanButtonText}>📷 Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Optional Fields */}
      <Text style={styles.sectionTitle}>Nickname (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. My H&M Card"
        value={nickname}
        onChangeText={setNickname}
        testID="nickname-input"
      />

      <Text style={styles.sectionTitle}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Any additional notes..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        testID="notes-input"
      />

      {/* Save Button */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          (!selectedShop || !cardNumber.trim()) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!selectedShop || !cardNumber.trim()}
        testID="save-card-button"
      >
        <Text style={styles.saveButtonText}>Save Card</Text>
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
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shopItem: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    width: '22%',
    minWidth: 75,
  },
  shopItemSelected: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shopItemName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
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
  scanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
