import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations, SupportedLanguage, TranslationKeys } from './translations';
import { getLanguageForCountry } from './index';

interface I18nContextType {
  language: SupportedLanguage;
  t: (key: TranslationKeys) => string;
  setLanguage: (lang: SupportedLanguage) => void;
  setLanguageFromCountry: (country: string) => void;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  t: (key) => key,
  setLanguage: () => {},
  setLanguageFromCountry: () => {},
});

export function I18nProvider({ children, initialCountry }: { children: React.ReactNode; initialCountry?: string }) {
  const [language, setLang] = useState<SupportedLanguage>(
    initialCountry ? getLanguageForCountry(initialCountry) : 'en'
  );

  const t = useCallback(
    (key: TranslationKeys): string => {
      const langTranslations = translations[language] || translations.en;
      return langTranslations[key] || translations.en[key] || key;
    },
    [language]
  );

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLang(lang);
  }, []);

  const setLanguageFromCountry = useCallback((country: string) => {
    setLang(getLanguageForCountry(country));
  }, []);

  return (
    <I18nContext.Provider value={{ language, t, setLanguage, setLanguageFromCountry }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
