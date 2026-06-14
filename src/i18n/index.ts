/**
 * Simple i18n system for Cards Central.
 * Language is automatically set based on the selected country,
 * but can be overridden by the user in Settings.
 */

import { translations, SupportedLanguage, TranslationKeys } from './translations';

let currentLanguage: SupportedLanguage = 'en';

/**
 * Country to default language mapping
 */
const COUNTRY_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  SK: 'sk',
  CZ: 'cs',
  PL: 'pl',
  HU: 'hu',
  AT: 'de',
  DE: 'de',
  CH: 'de',
  FR: 'fr',
  NL: 'en',
  IT: 'en',
  ES: 'en',
  RO: 'en',
  GB: 'en',
};

export function getLanguageForCountry(countryCode: string): SupportedLanguage {
  return COUNTRY_LANGUAGE_MAP[countryCode] || 'en';
}

export function setLanguage(lang: SupportedLanguage) {
  currentLanguage = lang;
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function t(key: TranslationKeys): string {
  const langTranslations = translations[currentLanguage] || translations.en;
  return langTranslations[key] || translations.en[key] || key;
}

export function getSupportedLanguages(): { code: SupportedLanguage; name: string }[] {
  return [
    { code: 'en', name: 'English' },
    { code: 'sk', name: 'Slovenčina' },
    { code: 'cs', name: 'Čeština' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pl', name: 'Polski' },
    { code: 'hu', name: 'Magyar' },
    { code: 'fr', name: 'Français' },
  ];
}

export type { SupportedLanguage, TranslationKeys };
