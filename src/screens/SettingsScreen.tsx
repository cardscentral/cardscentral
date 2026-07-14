import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import { getSelectedCountry, setSelectedCountry } from '../storage/preferences';

import { getSupportedLanguages, getLanguageForCountry, SupportedLanguage } from '../i18n';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import { ThemePreference } from '../storage/preferences';
import AsyncStorage from '@react-native-async-storage/async-storage';


const LANGUAGE_STORAGE_KEY = '@cardscentral/language';

const APP_VERSION = '1.0.0';
// Release notes for the current version on GitHub. Tags follow the `vX.Y.Z`
// convention created by the release workflow.
const RELEASE_NOTES_URL = `https://github.com/cardscentral/cardscentral/releases/tag/v${APP_VERSION}`;


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

  const { t, language, setLanguage: setI18nLanguage, setLanguageFromCountry } = useI18n();
  const { colors, preference, setThemePreference } = useTheme();

  const [country, setCountry] = useState<string>('SK');
  // Which in-app picker (if any) is open. `Alert.alert` with buttons is a no-op
  // on react-native-web, so we use a cross-platform Modal picker instead.
  const [picker, setPicker] = useState<null | 'country' | 'language'>(null);


  // Theme options shown in the appearance segmented control.
  const THEME_OPTIONS: { value: ThemePreference; labelKey: 'themeSystem' | 'themeLight' | 'themeDark' }[] = [
    { value: 'system', labelKey: 'themeSystem' },
    { value: 'light', labelKey: 'themeLight' },
    { value: 'dark', labelKey: 'themeDark' },
  ];


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

  const handleSelectCountry = async (code: string) => {
    setPicker(null);
    await setSelectedCountry(code);
    setCountry(code);
    // Also set default language for the new country (if no custom language set).
    const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!storedLang) {
      setLanguageFromCountry(code);
    }
  };

  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    setPicker(null);
    setI18nLanguage(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };


  const handleOpenReleaseNotes = () => {
    Linking.openURL(RELEASE_NOTES_URL).catch(() => {
      Alert.alert('Cards Central', RELEASE_NOTES_URL);
    });
  };


  const selectedLanguageName = getSupportedLanguages().find((l) => l.code === language)?.name || 'English';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      testID="settings-screen"
    >
      {/* General Settings */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]} testID="settings-general-title">{t('settings')}</Text>
        <TouchableOpacity style={[styles.row, { borderTopColor: colors.border }]} onPress={() => setPicker('country')} testID="settings-country">
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('country')}</Text>
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>{COUNTRY_NAMES[country] || country} ›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderTopColor: colors.border }]} onPress={() => setPicker('language')} testID="settings-language">

          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('language')}</Text>
          <Text style={[styles.rowValue, { color: colors.textMuted }]} testID="settings-language-value">{selectedLanguageName} ›</Text>
        </TouchableOpacity>
      </View>

      {/* Appearance */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('appearanceSection')}</Text>
        <View style={[styles.row, { borderTopColor: colors.border }]} testID="settings-theme">
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('theme')}</Text>
          <View style={[styles.segment, { backgroundColor: colors.controlBackground }]}>
            {THEME_OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.segmentButton, active && { backgroundColor: colors.primary }]}
                  onPress={() => setThemePreference(opt.value)}
                  testID={`settings-theme-${opt.value}`}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: active ? colors.onPrimary : colors.textMuted },
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Data Management */}

      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('dataSection')}</Text>


        <TouchableOpacity
          style={[styles.row, { borderTopColor: colors.border }]}
          onPress={() => navigation.navigate('ShareCards')}
          testID="settings-share-cards"
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('shareBackupCards')}</Text>
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.row, { borderTopColor: colors.border }]}
          onPress={() => navigation.navigate('Import')}
          testID="settings-import"
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('import')}</Text>
          <Text style={[styles.rowValue, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>
      </View>


      {/* App Info */}
      <View style={[styles.section, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('aboutSection')}</Text>
        <TouchableOpacity
          style={[styles.row, { borderTopColor: colors.border }]}
          onPress={handleOpenReleaseNotes}
          testID="settings-version"
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('version')}</Text>
          <Text style={[styles.rowValue, { color: colors.primary }]}>{APP_VERSION} ›</Text>
        </TouchableOpacity>

        <View style={[styles.creditRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.credits, { color: colors.textMuted }]}>{t('appTagline')}</Text>
        </View>

      </View>

      {/* Cross-platform selection modal (works on web where Alert buttons don't). */}
      <Modal
        visible={picker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPicker(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)} testID="picker-backdrop">
          {/* Stop propagation so taps inside the sheet don't dismiss it. */}
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.card }]}
            onPress={() => {}}
            testID={picker ? `picker-${picker}` : undefined}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {picker === 'country' ? t('country') : t('language')}
            </Text>
            <ScrollView style={styles.modalList}>
              {picker === 'country' &&
                Object.entries(COUNTRY_NAMES).map(([code, name]) => {
                  const active = code === country;
                  return (
                    <TouchableOpacity
                      key={code}
                      style={[styles.modalOption, { borderTopColor: colors.border }]}
                      onPress={() => handleSelectCountry(code)}
                      testID={`picker-country-${code}`}
                    >
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>{name}</Text>
                      {active && <Text style={[styles.modalCheck, { color: colors.primary }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              {picker === 'language' &&
                getSupportedLanguages().map((lang) => {
                  const active = lang.code === language;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[styles.modalOption, { borderTopColor: colors.border }]}
                      onPress={() => handleSelectLanguage(lang.code)}
                      testID={`picker-language-${lang.code}`}
                    >
                      <Text style={[styles.modalOptionText, { color: colors.text }]}>{lang.name}</Text>
                      {active && <Text style={[styles.modalCheck, { color: colors.primary }]}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCancel, { borderTopColor: colors.border }]}
              onPress={() => setPicker(null)}
              testID="picker-cancel"
            >
              <Text style={[styles.modalCancelText, { color: colors.primary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

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
  linkValue: {
    color: '#007AFF',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  segmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 13,
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 16,
  },
  modalList: {
    flexGrow: 0,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalCheck: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

