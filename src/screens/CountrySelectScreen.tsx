import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setSelectedCountry } from '../storage/preferences';

interface Country {
  code: string;
  name: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  // Central Europe
  { code: 'SK', name: 'Slovensko', flag: '🇸🇰' },
  { code: 'CZ', name: 'Česko', flag: '🇨🇿' },
  { code: 'PL', name: 'Polska', flag: '🇵🇱' },
  { code: 'HU', name: 'Magyarország', flag: '🇭🇺' },
  { code: 'AT', name: 'Österreich', flag: '🇦🇹' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪' },
  { code: 'CH', name: 'Schweiz', flag: '🇨🇭' },
  // Western Europe
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'België / Belgique', flag: '🇧🇪' },
  { code: 'NL', name: 'Nederland', flag: '🇳🇱' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  // Southern Europe
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'GR', name: 'Ελλάδα', flag: '🇬🇷' },
  { code: 'HR', name: 'Hrvatska', flag: '🇭🇷' },
  { code: 'SI', name: 'Slovenija', flag: '🇸🇮' },
  { code: 'RS', name: 'Srbija', flag: '🇷🇸' },
  // Eastern Europe
  { code: 'RO', name: 'România', flag: '🇷🇴' },
  { code: 'BG', name: 'България', flag: '🇧🇬' },
  { code: 'UA', name: 'Україна', flag: '🇺🇦' },
  // Northern Europe
  { code: 'DK', name: 'Danmark', flag: '🇩🇰' },
  { code: 'SE', name: 'Sverige', flag: '🇸🇪' },
  { code: 'NO', name: 'Norge', flag: '🇳🇴' },
  { code: 'FI', name: 'Suomi', flag: '🇫🇮' },
  // Baltic
  { code: 'EE', name: 'Eesti', flag: '🇪🇪' },
  { code: 'LV', name: 'Latvija', flag: '🇱🇻' },
  { code: 'LT', name: 'Lietuva', flag: '🇱🇹' },
];

interface CountrySelectScreenProps {
  onCountrySelected: (country: string) => void;
}

export function CountrySelectScreen({ onCountrySelected }: CountrySelectScreenProps) {
  const handleSelect = async (code: string) => {
    await setSelectedCountry(code);
    onCountrySelected(code);
  };

  const renderItem = ({ item, index }: { item: Country; index: number }) => (
    <TouchableOpacity
      style={[
        styles.item,
        index === 0 && styles.itemFirst,
        index === COUNTRIES.length - 1 && styles.itemLast,
      ]}
      onPress={() => handleSelect(item.code)}
      testID={`country-${item.code}`}
      activeOpacity={0.6}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={styles.itemName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const ItemSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="location-outline" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Select your country</Text>
        <Text style={styles.subtitle}>
          Cards and stores will be tailored to your location
        </Text>
      </View>
      <FlatList
        data={COUNTRIES}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 32,
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  itemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  itemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  flag: {
    fontSize: Platform.OS === 'android' ? 22 : 24,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 52,
  },
});
