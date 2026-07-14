/**
 * User Preferences Storage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKey } from './storageKey';

// Stage-namespaced (see storageKey.ts) so QA (/qa/) and prod (/app/) — which
// share the same web origin/localStorage — keep fully separate preferences.
const COUNTRY_KEY = storageKey('country');
const VIEW_MODE_KEY = storageKey('viewMode');
const THEME_KEY = storageKey('theme');



export async function getSelectedCountry(): Promise<string | null> {
  return AsyncStorage.getItem(COUNTRY_KEY);
}

export async function setSelectedCountry(country: string): Promise<void> {
  await AsyncStorage.setItem(COUNTRY_KEY, country);
}

/** How the cards list is laid out on the main screen. */
export type CardsViewMode = 'list' | 'grid';

/**
 * Returns the persisted cards-list view mode, or `null` if the user has never
 * chosen one (callers fall back to their own default).
 */
export async function getViewMode(): Promise<CardsViewMode | null> {
  const stored = await AsyncStorage.getItem(VIEW_MODE_KEY);
  return stored === 'list' || stored === 'grid' ? stored : null;
}

export async function setViewMode(mode: CardsViewMode): Promise<void> {
  await AsyncStorage.setItem(VIEW_MODE_KEY, mode);
}

/**
 * Which color scheme the app should use. `system` (the default) follows the OS
 * appearance setting; `light`/`dark` force a specific scheme.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Returns the persisted theme preference, or `null` if the user has never
 * chosen one (callers default to `system`).
 */
export async function getThemePreference(): Promise<ThemePreference | null> {
  const stored = await AsyncStorage.getItem(THEME_KEY);
  return stored === 'system' || stored === 'light' || stored === 'dark' ? stored : null;
}

export async function setThemePreference(pref: ThemePreference): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, pref);
}


