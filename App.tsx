import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator, openSharedCardImport } from './src/navigation/AppNavigator';
import { CountrySelectScreen } from './src/screens/CountrySelectScreen';
import { getSelectedCountry } from './src/storage/preferences';
import { requestPersistentStorage } from './src/storage/persistStorage';
import { I18nProvider } from './src/i18n/I18nContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { getSharePayloadFromLocation, clearShareFragment } from './src/utils/cardShare';


function AppContent() {
  const { colors, scheme } = useTheme();

  const [country, setCountry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ask the browser to keep our storage persistent so an installed PWA
    // doesn't lose the user's cards to storage eviction. No-op on native.
    requestPersistentStorage();

    getSelectedCountry().then((c) => {
      setCountry(c);
      setLoading(false);
    });
  }, []);

  // Handle shared-card links (`…/#import=<payload>`). On web we read the URL
  // fragment on launch and whenever it changes (e.g. the user pastes a new
  // link). We retry briefly because the navigation container may not be ready
  // the moment the payload is detected. No-op on native, where there is no URL.
  useEffect(() => {
    if (!country) return; // Country picker is shown first; navigator isn't mounted yet.

    const handlePayload = () => {
      const payload = getSharePayloadFromLocation();
      if (!payload) return;

      let attempts = 0;
      const tryOpen = () => {
        attempts += 1;
        openSharedCardImport(payload);
        clearShareFragment();
      };
      // Give the NavigationContainer a moment to become ready on cold start.
      const timer = setInterval(() => {
        tryOpen();
        if (attempts >= 5) clearInterval(timer);
      }, 150);
      tryOpen();
      // Safety: stop retrying after ~1s regardless.
      setTimeout(() => clearInterval(timer), 1000);
    };

    handlePayload();

    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('hashchange', handlePayload);
      return () => window.removeEventListener('hashchange', handlePayload);
    }
    return undefined;
  }, [country]);


  // StatusBar contrast is derived from the resolved scheme so it stays legible
  // in both light and dark mode (including when following the OS).
  const statusBarStyle = scheme === 'dark' ? 'light' : 'dark';

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!country) {
    return (
      <>
        <StatusBar style={statusBarStyle} />
        <CountrySelectScreen onCountrySelected={(c) => setCountry(c)} />
      </>
    );
  }

  return (
    <I18nProvider initialCountry={country}>
      <StatusBar style={statusBarStyle} />
      <AppNavigator />
    </I18nProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

