import React from 'react';
import { Platform } from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
  LinkingOptions,
  getStateFromPath as defaultGetStateFromPath,
  getPathFromState as defaultGetPathFromState,
} from '@react-navigation/native';



import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList, MainTabParamList } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';

import { CardsListScreen } from '../screens/CardsListScreen';
import { CardDetailScreen } from '../screens/CardDetailScreen';
import { AddCardScreen } from '../screens/AddCardScreen';
import { CardDetailsScreen } from '../screens/CardDetailsScreen';
import { EditCardScreen } from '../screens/EditCardScreen';
import { ScanBarcodeScreen } from '../screens/ScanBarcodeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ImportScreen } from '../screens/ImportScreen';
import { ImportSharedScreen } from '../screens/ImportSharedScreen';
import { ShareCardsScreen } from '../screens/ShareCardsScreen';
import { HeaderLogo } from '../components/HeaderLogo';




const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Navigation ref so non-component code (e.g. deep-link handling in App.tsx) can
 * navigate once the container is ready — used to open the shared-card importer.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/** Navigate to the shared-card import screen if navigation is ready. */
export function openSharedCardImport(payload: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('ImportShared', { payload });
  }
}

/**
 * Web deep-linking / URL sync.
 *
 * Without this, react-native-web keeps all navigation in memory only — the URL
 * never changes as you move between screens, so the browser Back button (and
 * the Android system back gesture in an installed PWA) has nothing to pop and
 * appears to "do nothing". Wiring up `linking` makes React Navigation push a
 * browser history entry per screen, so Back/Forward work as users expect and
 * screens become directly linkable/shareable.
 *
 * The shared-card importer keeps its existing `#import=<payload>` fragment
 * handling in App.tsx and is intentionally not URL-mapped here.
 */

// The app is served under a base path on GitHub Pages (e.g. `/cardscentral/`,
// `/app/`, `/qa/`) — configurable at build time. React Navigation's web
// history writes absolute paths, so it must know this base or it would drop it
// (turning `/cardscentral/card/123` into `/card/123`); on the next reload the
// server can't find that path and the app fails to boot. We wrap the default
// path<->state converters to strip the base when reading and re-add it when
// writing.
//
// The base is derived at runtime from the injected manifest <link> (build-web.js
// always writes `href="<base>manifest.webmanifest"`), falling back to the
// default so it also works in dev.
function detectWebBasePath(): string {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return '/';
  const manifest = document.querySelector('link[rel="manifest"]');
  const href = manifest?.getAttribute('href') || '';
  const match = href.match(/^(.*\/)manifest\.webmanifest$/);
  const base = match ? match[1] : '/cardscentral/';
  return base.startsWith('/') ? base : '/' + base;
}

// Normalised to always start and end with a single slash (e.g. `/cardscentral/`).
const WEB_BASE_PATH =
  Platform.OS === 'web' && typeof window !== 'undefined' ? detectWebBasePath() : '/';
// Without the trailing slash, for prefix matching (e.g. `/cardscentral`).
const WEB_BASE_NO_SLASH = WEB_BASE_PATH.replace(/\/$/, '');

const linking: LinkingOptions<RootStackParamList> = {
  prefixes:
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? [window.location.origin + WEB_BASE_NO_SLASH, window.location.origin]
      : [],
  // Strip the base path before React Navigation matches the route.
  getStateFromPath: (path, options) => {
    let rest = path;
    if (WEB_BASE_NO_SLASH && rest.startsWith(WEB_BASE_NO_SLASH)) {
      rest = rest.slice(WEB_BASE_NO_SLASH.length) || '/';
    }
    return defaultGetStateFromPath(rest, options);
  },
  // Re-add the base path so history entries stay under the served base.
  getPathFromState: (state, config) => {
    const path = defaultGetPathFromState(state, config);
    if (!WEB_BASE_NO_SLASH) return path;
    return WEB_BASE_NO_SLASH + (path.startsWith('/') ? path : '/' + path);
  },
  config: {

    screens: {

      // The tab navigator lives at the root. Each tab gets its own path so a
      // deep tab URL (e.g. /settings) survives a page refresh / direct load:
      //   Cards    → base root ('')
      //   Settings → /settings
      // Without these, getPathFromState still appends the tab name to the URL
      // but getStateFromPath can't map it back, so a refresh on /Settings
      // silently fell back to the first (Cards) tab.
      Main: {
        screens: {
          Cards: '',
          Settings: 'settings',
        },
      },
      AddCard: 'add',

      CardDetails: 'card-details',
      EditCard: 'edit/:cardId',
      CardDetail: 'card/:cardId',
      ScanBarcode: 'scan',
      Import: 'import',
      ShareCards: 'share',
      // ImportShared is reached via the `#import=` fragment, not a mapped path.
      ImportShared: 'import-shared',
    },
  },
};




function MainTabs() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >

      <Tab.Screen
        name="Cards"
        component={CardsListScreen}
        options={{
          // The header shows the brand (logo + "Cards Central") instead of the
          // plain "My Cards" title; the bottom-tab label keeps the localized
          // text via tabBarLabel.
          headerTitle: () => <HeaderLogo />,
          tabBarLabel: t('myCards'),
          // Stable testID so E2E flows can find the tab regardless of the
          // localized title (the UI switches to Slovak once SK is selected).
          tabBarButtonTestID: 'tab-cards',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="loyalty" size={size} color={color} />
          ),
        }}

      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings'),
          tabBarButtonTestID: 'tab-settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />

    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();
  return (
    <NavigationContainer
      ref={navigationRef}
      // Only sync navigation to the URL on web so the browser Back/Forward
      // buttons work; native keeps its default in-memory stack behavior.
      linking={Platform.OS === 'web' ? linking : undefined}
    >


      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >

        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddCard"
          component={AddCardScreen}
          options={{ title: 'Add Card' }}
        />
        <Stack.Screen
          name="CardDetails"
          component={CardDetailsScreen}
          options={{ title: 'Card Details' }}
        />
        <Stack.Screen
          name="EditCard"
          component={EditCardScreen}
          options={{ title: 'Edit Card' }}
        />
        <Stack.Screen
          name="CardDetail"
          component={CardDetailScreen}
          options={{ title: 'Card Details', headerTransparent: true, headerTintColor: '#FFFFFF' }}
        />
        <Stack.Screen
          name="ScanBarcode"
          component={ScanBarcodeScreen}
          options={{ title: 'Scan Barcode', headerTransparent: true, headerTintColor: '#FFFFFF' }}
        />
        <Stack.Screen
          name="Import"
          component={ImportScreen}
          options={{ title: 'Import' }}
        />
        <Stack.Screen
          name="ImportShared"
          component={ImportSharedScreen}
          options={{ title: 'Add Shared Card' }}
        />
        <Stack.Screen
          name="ShareCards"
          component={ShareCardsScreen}
          options={{ title: 'Share Cards' }}
        />
      </Stack.Navigator>



    </NavigationContainer>
  );
}
