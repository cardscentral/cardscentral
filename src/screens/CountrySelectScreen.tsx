import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
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

  const renderItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleSelect(item.code)}
      testID={`country-${item.code}`}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCode}>{item.code}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>Choose Your Country</Text>
        <Text style={styles.subtitle}>
          We'll show you loyalty cards available in your country
        </Text>
      </View>
      <FlatList
        data={COUNTRIES}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  itemCode: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
});
