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
import { RootStackParamList } from '../types';
import { generateId } from '../utils/generateId';
import { addCard } from '../storage/cardStorage';
import { getShopById } from '../config/shops';
import { ShopIcon } from '../components/ShopIcon';
import { MaterialIcons } from '@expo/vector-icons';
import { useI18n } from '../i18n/I18nContext';

type CardDetailsRouteProp = RouteProp<RootStackParamList, 'CardDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CardDetailsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CardDetailsRouteProp>();
  const { t } = useI18n();

  const shop = getShopById(route.params.shopId);
  const [cardNumber, setCardNumber] = useState(route.params.scannedCode || '');
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (route.params.scannedCode) {
      setCardNumber(route.params.scannedCode);
    }
  }, [route.params.scannedCode]);

  const handleScan = () => {
    navigation.navigate('ScanBarcode', { shopId: shop?.id });
  };

  const handleSave = async () => {
    if (!shop) {
      Alert.alert('Error', 'Shop not found');
      return;
    }
    if (!cardNumber.trim()) {
      Alert.alert('Error', 'Please enter or scan a card number');
      return;
    }

    const now = new Date().toISOString();
    await addCard({
      id: generateId(),
      shopId: shop.id,
      cardNumber: cardNumber.trim(),
      nickname: nickname.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Go back to the main cards list
    navigation.popToTop();
  };

  if (!shop) {
    return (
      <View style={styles.container} testID="card-details-screen">
        <Text>Shop not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="card-details-screen"
    >
      {/* Selected Shop Header */}

      <View style={styles.shopHeader}>
        <ShopIcon brand={shop.brand} shopId={shop.id} name={shop.name} size={48} />
        <Text style={styles.shopName}>{shop.name}</Text>
      </View>

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
          <Text style={styles.scanButtonText}> {t('scan')}</Text>
        </TouchableOpacity>
      </View>

      {/* Optional Fields */}
      <Text style={styles.sectionTitle}>{t('nicknameOptional')}</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. My Card"
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
          !cardNumber.trim() && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={!cardNumber.trim()}
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
  shopHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
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
