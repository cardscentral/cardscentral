/**
 * Simple i18n system for Cards Central.
 * Language is automatically set based on the selected country,
 * but can be overridden by the user in Settings.
 *
 * Languages that don't yet have a full translation table fall back to
 * English on a per-key basis (see `t()`), so registering a new EU
 * language here is safe even before every string is localized.
 */

import { translations, SupportedLanguage, TranslationKeys } from './translations';

let currentLanguage: SupportedLanguage = 'en';

/**
 * Country → default language mapping.
 * Covers all EU/EEA + UK/CH locales. Countries without a dedicated
 * language table fall back to English.
 */
const COUNTRY_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  // Central Europe
  SK: 'sk',
  CZ: 'cs',
  PL: 'pl',
  HU: 'hu',
  AT: 'de',
  DE: 'de',
  CH: 'de',
  LI: 'de',
  // Western Europe
  FR: 'fr',
  BE: 'nl',
  NL: 'nl',
  LU: 'fr',
  GB: 'en',
  IE: 'en',
  // Southern Europe
  ES: 'es',
  PT: 'pt',
  IT: 'it',
  GR: 'el',
  CY: 'el',
  MT: 'en',
  HR: 'hr',
  SI: 'sl' as SupportedLanguage, // falls back to en until sl table exists
  // Eastern Europe
  RO: 'ro',
  BG: 'bg' as SupportedLanguage, // falls back to en
  // Northern Europe
  DK: 'da',
  SE: 'sv',
  FI: 'fi',
  // Baltic
  EE: 'et' as SupportedLanguage,
  LV: 'lv' as SupportedLanguage,
  LT: 'lt' as SupportedLanguage,
  // Eastern Europe / CIS
  RU: 'ru',
  BY: 'ru',
  KZ: 'ru',
  // Asia
  JP: 'ja',
  KR: 'ko',
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  SG: 'zh',
  TH: 'th',
};


export function getLanguageForCountry(countryCode: string): SupportedLanguage {
  const mapped = COUNTRY_LANGUAGE_MAP[countryCode];
  // Only return a language we actually have a table for; otherwise English.
  if (mapped && translations[mapped]) return mapped;
  return 'en';
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
  const all: { code: SupportedLanguage; name: string }[] = [

    { code: 'en', name: 'English' },
    { code: 'sk', name: 'Slovenčina' },
    { code: 'cs', name: 'Čeština' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pl', name: 'Polski' },
    { code: 'hu', name: 'Magyar' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'it', name: 'Italiano' },
    { code: 'nl', name: 'Nederlands' },
    { code: 'pt', name: 'Português' },
    { code: 'ro', name: 'Română' },
    { code: 'sv', name: 'Svenska' },
    { code: 'da', name: 'Dansk' },
    { code: 'fi', name: 'Suomi' },
    { code: 'el', name: 'Ελληνικά' },
    { code: 'hr', name: 'Hrvatski' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' },
    { code: 'th', name: 'ไทย' },
  ];

  // Only expose languages that actually have a translation table.
  return all.filter((l) => !!translations[l.code]);
}


export type { SupportedLanguage, TranslationKeys };
