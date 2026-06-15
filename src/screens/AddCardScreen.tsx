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
import { RootStackParamList, ShopConfig } from '../types';
import { generateId } from '../utils/generateId';
import { addCard } from '../storage/cardStorage';
import { getShopById, getShopsByCountry } from '../config/shops';
import { getSelectedCountry } from '../storage/preferences';
import { ShopIcon } from '../components/ShopIcon';
import { MaterialIcons } from '@expo/vector-icons';
import { useI18n } from '../i18n/I18nContext';

type AddCardRouteProp = RouteProp<RootStackParamList, 'AddCard'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function AddCardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddCardRouteProp>();
  const { t } = useI18n();
  const preselectedShopId = route.params?.shopId;

  const [selectedShop, setSelectedShop] = useState<ShopConfig | undefined>(
    preselectedShopId ? getShopById(preselectedShopId) : undefined
  );
  const [cardNumber, setCardNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState('');
  const [allShops, setAllShops] = useState<ShopConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getSelectedCountry().then((country) => {
      if (country) {
        setAllShops(getShopsByCountry(country));
      }
    });
  }, []);

  const filteredShops = searchQuery.trim()
    ? allShops.filter((shop) =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allShops;

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
      id: generateId(),
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
      {/* Search Bar */}
      <Text style={styles.mainTitle}>{t('selectShop')}</Text>
      <TextInput
        style={styles.searchInput}
        placeholder={t('searchShops')}
        value={searchQuery}
        onChangeText={setSearchQuery}
        testID="shop-search-input"
        clearButtonMode="while-editing"
      />

      {/* Shop Grid (flat, no categories) */}
      <View style={styles.shopGrid}>
        {filteredShops.map((shop) => (
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
            <ShopIcon brand={shop.brand} shopId={shop.id} name={shop.name} size={36} />
            <Text style={styles.shopItemName} numberOfLines={2}>
              {shop.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredShops.length === 0 && searchQuery.trim() && (
        <Text style={styles.noResults}>No shops matching "{searchQuery}"</Text>
      )}

      {/* Card Number Input */}
      <Text style={styles.sectionTitle}>{t('cardNumber')}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t('enterCardNumber')}
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="default"
          autoCapitalize="none"
          testID="card-number-input"
        />
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScan}
          testID="scan-barcode-button"
        >
          <MaterialIcons name="qr-code-scanner" size={18} color="#FFFFFF" />
          <Text style={styles.scanButtonText}> Scan</Text>
        </TouchableOpacity>
      </View>

      {/* Optional Fields */}
      <Text style={styles.sectionTitle}>{t('nicknameOptional')}</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. My H&M Card"
        value={nickname}
        onChangeText={setNickname}
        testID="nickname-input"
      />

      <Text style={styles.sectionTitle}>{t('notesOptional')}</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder={t('notes')}
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
        <Text style={styles.saveButtonText}>{t('saveCard')}</Text>
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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 16,
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
  noResults: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
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
