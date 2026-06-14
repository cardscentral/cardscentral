/**
 * User Preferences Storage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const COUNTRY_KEY = '@cardscentral/country';

export async function getSelectedCountry(): Promise<string | null> {
  return AsyncStorage.getItem(COUNTRY_KEY);
}

export async function setSelectedCountry(country: string): Promise<void> {
  await AsyncStorage.setItem(COUNTRY_KEY, country);
}
