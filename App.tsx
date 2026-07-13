import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { CountrySelectScreen } from './src/screens/CountrySelectScreen';
import { getSelectedCountry } from './src/storage/preferences';
import { requestPersistentStorage } from './src/storage/persistStorage';
import { I18nProvider } from './src/i18n/I18nContext';

export default function App() {
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!country) {
    return (
      <>
        <StatusBar style="dark" />
        <CountrySelectScreen onCountrySelected={(c) => setCountry(c)} />
      </>
    );
  }

  return (
    <I18nProvider initialCountry={country}>
      <StatusBar style="auto" />
      <AppNavigator />
    </I18nProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
});
