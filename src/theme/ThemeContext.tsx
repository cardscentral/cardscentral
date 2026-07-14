import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  ThemePreference,
  getThemePreference,
  setThemePreference as persistThemePreference,
} from '../storage/preferences';

/** The two concrete color schemes the palettes are defined for. */
export type ColorScheme = 'light' | 'dark';

/**
 * Semantic color palette consumed by screens/components. Keeping the surface
 * small (semantic roles rather than raw values) means individual screens stay
 * theme-agnostic and both schemes are guaranteed to stay in sync.
 */
export interface ThemeColors {
  /** Screen background (behind scrollable content). */
  background: string;
  /** Raised surfaces: cards, rows, tab/header bars. */
  card: string;
  /** Divider / border lines. */
  border: string;
  /** Primary text. */
  text: string;
  /** Secondary / muted text. */
  textMuted: string;
  /** Brand accent (buttons, active states, links). */
  primary: string;
  /** Text/icon color rendered on top of `primary`. */
  onPrimary: string;
  /** Neutral control background (inactive toggle buttons, chips). */
  controlBackground: string;
  /** Destructive actions. */
  danger: string;
}

const lightColors: ThemeColors = {
  background: '#F5F5F7',
  card: '#FFFFFF',
  border: '#E5E5E5',
  text: '#1a1a1a',
  textMuted: '#666666',
  primary: '#007AFF',
  onPrimary: '#FFFFFF',
  controlBackground: '#E5E5E5',
  danger: '#FF3B30',
};

const darkColors: ThemeColors = {
  background: '#000000',
  card: '#1C1C1E',
  border: '#38383A',
  text: '#F2F2F7',
  textMuted: '#98989F',
  primary: '#0A84FF',
  onPrimary: '#FFFFFF',
  controlBackground: '#2C2C2E',
  danger: '#FF453A',
};

export const palettes: Record<ColorScheme, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};

interface ThemeContextType {
  /** User's preference: `system` (default) follows the OS. */
  preference: ThemePreference;
  /** The resolved scheme actually in effect (`system` → OS value). */
  scheme: ColorScheme;
  /** Active color palette for the resolved scheme. */
  colors: ThemeColors;
  /** Change and persist the preference. */
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  preference: 'system',
  scheme: 'light',
  colors: lightColors,
  setThemePreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme(); // reflects the OS setting, updates live
  const [preference, setPreference] = useState<ThemePreference>('system');

  // Restore the persisted preference on mount (defaults to `system`).
  useEffect(() => {
    getThemePreference().then((stored) => {
      if (stored) setPreference(stored);
    });
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    setPreference(pref);
    persistThemePreference(pref);
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextType>(
    () => ({ preference, scheme, colors: palettes[scheme], setThemePreference }),
    [preference, scheme, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
