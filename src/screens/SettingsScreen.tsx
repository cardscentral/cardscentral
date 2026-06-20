import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getSyncStatus } from '../storage/syncService';

import { clearAllCards } from '../storage/cardStorage';
import { getSelectedCountry, setSelectedCountry } from '../storage/preferences';
import { getSupportedLanguages, getLanguageForCountry, SupportedLanguage } from '../i18n';
import { useI18n } from '../i18n/I18nContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@cardscentral/language';

const COUNTRY_NAMES: Record<string, string> = {
  SK: '🇸🇰 Slovakia',
  CZ: '🇨🇿 Czechia',
  PL: '🇵🇱 Poland',
  HU: '🇭🇺 Hungary',
  AT: '🇦🇹 Austria',
  DE: '🇩🇪 Germany',
  HR: '🇭🇷 Croatia',
  RO: '🇷🇴 Romania',
  BG: '🇧🇬 Bulgaria',
  SI: '🇸🇮 Slovenia',
  CH: '🇨🇭 Switzerland',
  FR: '🇫🇷 France',
  NL: '🇳🇱 Netherlands',
  IT: '🇮🇹 Italy',
  ES: '🇪🇸 Spain',
  GB: '🇬🇧 United Kingdom',
};

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const syncStatus = getSyncStatus();

  const { t, language, setLanguage: setI18nLanguage, setLanguageFromCountry } = useI18n();
  const [country, setCountry] = useState<string>('SK');

  useEffect(() => {
    getSelectedCountry().then((c) => {
      if (c) {
        setCountry(c);
        // Load stored language preference or use country default
        AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
          if (stored) {
            setI18nLanguage(stored as SupportedLanguage);
          } else {
            setLanguageFromCountry(c);
          }
        });
      }
    });
  }, []);

  const handleChangeCountry = () => {
    const options = Object.entries(COUNTRY_NAMES).map(([code, name]) => ({
      text: name,
      onPress: async () => {
        await setSelectedCountry(code);
        setCountry(code);
        // Also set default language for the new country (if no custom language set)
        const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (!storedLang) {
          setLanguageFromCountry(code);
        }
      },
    }));

    Alert.alert(t('country'), undefined, [
      ...options.slice(0, 6),
      { text: 'More...', onPress: () => {
        Alert.alert('More Countries', undefined, [
          ...options.slice(6, 12),
          { text: t('cancel'), style: 'cancel' },
        ]);
      }},
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const handleChangeLanguage = () => {
    const languages = getSupportedLanguages();
    const options = languages.map((lang) => ({
      text: `${lang.name}${lang.code === language ? ' ✓' : ''}`,
      onPress: async () => {
        setI18nLanguage(lang.code);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang.code);
      },
    }));

    Alert.alert(t('language'), undefined, [
      ...options,
      { text: t('cancel'), style: 'cancel' },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      t('deleteCard'),
      t('deleteConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await clearAllCards();
          },
        },
      ]
    );
  };

  const selectedLanguageName = getSupportedLanguages().find((l) => l.code === language)?.name || 'English';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="settings-screen">
      {/* General Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle} testID="settings-general-title">{t('settings')}</Text>
        <TouchableOpacity style={styles.row} onPress={handleChangeCountry} testID="settings-country">
          <Text style={styles.rowLabel}>{t('country')}</Text>
          <Text style={styles.rowValue}>{COUNTRY_NAMES[country] || country} ›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={handleChangeLanguage} testID="settings-language">
          <Text style={styles.rowLabel}>{t('language')}</Text>
          <Text style={styles.rowValue} testID="settings-language-value">{selectedLanguageName} ›</Text>
        </TouchableOpacity>
      </View>

      {/* Cloud Sync (Premium) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('premium')}</Text>
        <View style={styles.premiumBanner}>
          <Text style={styles.premiumIcon}>⭐</Text>
          <View style={styles.premiumInfo}>
            <Text style={styles.premiumTitle}>{t('premium')}</Text>
            <Text style={styles.premiumDescription}>
              {t('premiumDescription')}
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
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate('Import')}
          testID="settings-import"
        >
          <Text style={styles.rowLabel}>{t('import')}</Text>
          <Text style={styles.rowValue}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerRow} onPress={handleClearData} testID="settings-clear-data">
          <Text style={styles.dangerText}>{t('deleteCard')}</Text>
        </TouchableOpacity>
      </View>


      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
        <View style={styles.creditRow}>
          <Text style={styles.credits}>
            Cards Central - Your loyalty cards in one place.{'\n'}
            Made with ❤️ in Slovakia
          </Text>
        </View>
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
  creditRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  credits: {
    fontSize: 13,
    color: '#999',
    lineHeight: 20,
    textAlign: 'center',
  },
});
