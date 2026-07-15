import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, ShopConfig } from '../types';
import { getShopsByCountry } from '../config/shops';
import { getSelectedCountry } from '../storage/preferences';
import { ShopIcon } from '../components/ShopIcon';
import { useI18n } from '../i18n/I18nContext';

type AddCardRouteProp = RouteProp<RootStackParamList, 'AddCard'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function AddCardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddCardRouteProp>();
  const { t } = useI18n();
  const preselectedShopId = route.params?.shopId;

  const [allShops, setAllShops] = useState<ShopConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // If a shop was preselected, navigate directly to card details
    if (preselectedShopId) {
      navigation.replace('CardDetails', { shopId: preselectedShopId });
    }
  }, [preselectedShopId, navigation]);

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

  const handleShopSelect = (shop: ShopConfig) => {
    navigation.navigate('CardDetails', { shopId: shop.id });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="add-card-screen"
    >
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

      {/* Shop Grid */}
      <View style={styles.shopGrid}>
        {filteredShops.map((shop) => (
          <TouchableOpacity
            key={shop.id}
            style={styles.shopItem}
            onPress={() => handleShopSelect(shop)}
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
});
