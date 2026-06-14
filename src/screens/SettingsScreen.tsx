import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getSyncStatus } from '../storage/syncService';
import { clearAllCards } from '../storage/cardStorage';
import { getSelectedCountry, setSelectedCountry } from '../storage/preferences';

const COUNTRY_NAMES: Record<string, string> = {
  SK: 'Slovakia 🇸🇰',
  CZ: 'Czechia 🇨🇿',
  PL: 'Poland 🇵🇱',
  HU: 'Hungary 🇭🇺',
  AT: 'Austria 🇦🇹',
  DE: 'Germany 🇩🇪',
  HR: 'Croatia 🇭🇷',
  RO: 'Romania 🇷🇴',
  BG: 'Bulgaria 🇧🇬',
  SI: 'Slovenia 🇸🇮',
};

export function SettingsScreen() {
  const syncStatus = getSyncStatus();
  const [country, setCountry] = useState<string>('SK');

  useEffect(() => {
    getSelectedCountry().then((c) => {
      if (c) setCountry(c);
    });
  }, []);

  const handleChangeCountry = () => {
    const options = Object.entries(COUNTRY_NAMES).map(([code, name]) => ({
      text: name,
      onPress: async () => {
        await setSelectedCountry(code);
        setCountry(code);
      },
    }));
    Alert.alert('Change Country', 'Select your country:', [
      ...options.slice(0, 5),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your saved cards. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            await clearAllCards();
            Alert.alert('Done', 'All cards have been deleted.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
        <TouchableOpacity style={styles.row} onPress={handleChangeCountry}>
          <Text style={styles.rowLabel}>Country</Text>
          <Text style={styles.rowValue}>{COUNTRY_NAMES[country] || country} ›</Text>
        </TouchableOpacity>
      </View>

      {/* Cloud Sync (Premium) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cloud Sync</Text>
        <View style={styles.premiumBanner}>
          <Text style={styles.premiumIcon}>⭐</Text>
          <View style={styles.premiumInfo}>
            <Text style={styles.premiumTitle}>Premium Feature</Text>
            <Text style={styles.premiumDescription}>
              Sync your cards across devices and share with family members.
              Coming soon!
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={[styles.rowValue, { color: syncStatus.isPremium ? '#34C759' : '#999' }]}>
            {syncStatus.isPremium ? 'Active' : 'Free Plan'}
          </Text>
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity style={styles.dangerRow} onPress={handleClearData}>
          <Text style={styles.dangerText}>Delete All Cards</Text>
        </TouchableOpacity>
      </View>

      {/* Credits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credits</Text>
        <Text style={styles.credits}>
          Cards Central - Your loyalty cards in one place.{'\n'}
          Made with ❤️ in Slovakia
        </Text>
      </View>
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
  section: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  rowLabel: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  rowValue: {
    fontSize: 15,
    color: '#666',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  premiumIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  premiumInfo: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  premiumDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    lineHeight: 18,
  },
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  dangerText: {
    fontSize: 15,
    color: '#FF3B30',
    fontWeight: '500',
  },
  credits: {
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
});
