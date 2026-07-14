/**
 * openShopApp
 *
 * Helpers for launching a shop's official app or its store listing.
 *
 * A shop offers a store link ONLY when its YAML `apps` block declares a
 * concrete, verified store reference (App Store `store_id` / Play Store
 * `package`). Those references are validated against the live stores by
 * `scripts/verify-app-links.js`; dead ones are stripped out.
 *
 * We deliberately do NOT fall back to a name-based store *search* URL: pointing
 * users at a search results page (or, worse, a guessed listing that 404s) is a
 * poor experience, so when a shop has no verified reference we surface no store
 * button at all (getStoreUrl returns undefined and the UI hides the section).
 *
 * This uses only React Native's `Linking`; no extra native modules required.

 */

import { Linking, Platform } from 'react-native';
import { ShopAppLinks, ShopConfig } from '../types';

/** Minimal shop shape these helpers need. */
type ShopLike = Pick<ShopConfig, 'apps'> & { id?: string; name?: string };

/**
 * Resolve the effective app links for a shop from its YAML `apps` block.
 */
export function resolveAppLinks(shop: ShopLike): ShopAppLinks | undefined {
  return shop.apps;
}

/**
 * Whether the current platform can *detect* and deep-link into an installed
 * native app. This is a native-only capability: browsers (PWA) deliberately
 * provide no way to query whether a third-party app is installed (privacy), so
 * `Linking.canOpenURL` on custom schemes is unreliable there. On web we always
 * fall back to store/website links instead of pretending we can open the app.
 */
export function canDetectInstalledApps(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * True if the shop declares a *known* native app (via its YAML `apps` block)
 * for the current platform. Drives the "app available" badge and the deep-link
 * button.
 *
 * Always false on web (PWA): we can't detect or reliably deep-link into
 * installed apps there, so we don't show the "app available" affordance.
 * Note: even when this is false, getStoreUrl() may still return a direct store
 * listing (e.g. on web, or when only the *other* platform declares an app).
 */

export function hasShopApp(shop: ShopLike): boolean {
  if (!canDetectInstalledApps()) return false;
  const apps = resolveAppLinks(shop);
  if (!apps) return false;
  return Platform.OS === 'ios' ? !!apps.ios : !!apps.android;
}

/**
 * Build the App Store (iOS) https URL for a shop — a direct listing to the
 * shop's verified app. Returns undefined when the shop declares no valid iOS
 * `store_id` (we don't link to a name-based search; see file header).
 */
export function getAppStoreUrl(shop: ShopLike): string | undefined {
  const apps = resolveAppLinks(shop);
  if (apps?.ios?.store_id) {
    return `https://apps.apple.com/app/id${apps.ios.store_id}`;
  }
  return undefined;
}

/**
 * Build the Google Play (Android) https URL for a shop — a direct listing to
 * the shop's verified app. Returns undefined when the shop declares no valid
 * Android `package` (we don't link to a name-based search; see file header).
 */
export function getPlayStoreUrl(shop: ShopLike): string | undefined {
  const apps = resolveAppLinks(shop);
  if (apps?.android?.package) {
    return `https://play.google.com/store/apps/details?id=${apps.android.package}`;
  }
  return undefined;
}


/**
 * Build the https store URL for the *current* platform (kept for callers that
 * only care about the running platform, e.g. openStorePage fallback).
 */
export function getStoreUrl(shop: ShopLike): string | undefined {
  return Platform.OS === 'ios' ? getAppStoreUrl(shop) : getPlayStoreUrl(shop);
}

/** Open an arbitrary https store url (used by the explicit store buttons). */
export async function openUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Deep-link scheme for the current platform, if configured. */
function getScheme(shop: ShopLike): string | undefined {
  const apps = resolveAppLinks(shop);
  if (!apps) return undefined;
  return Platform.OS === 'ios' ? apps.ios?.scheme : apps.android?.scheme;
}

/**
 * Try to open the installed app; if it isn't installed (or no scheme is
 * configured), open the store page so the user can install it.
 * Returns true if any URL was opened.
 */
export async function openShopApp(shop: ShopLike): Promise<boolean> {
  const scheme = getScheme(shop);

  // On web (PWA) we can't detect or reliably deep-link into a native app, so
  // skip the scheme attempt entirely and send the user to the store/website.
  if (scheme && canDetectInstalledApps()) {
    try {
      const canOpen = await Linking.canOpenURL(scheme);
      if (canOpen) {
        await Linking.openURL(scheme);
        return true;
      }
    } catch {
      // Fall through to the store link below.
    }
  }

  return openStorePage(shop);
}

/**
 * Open the platform store listing for the shop's app.
 * Tries the native store scheme first, then the https fallback.
 */
export async function openStorePage(shop: ShopLike): Promise<boolean> {
  const apps = resolveAppLinks(shop);

  // Native store schemes open the store app directly (nicer than a browser),
  // but only work when a concrete id/package is known — and only on native
  // (on web these schemes can't be opened, so we skip straight to https).
  const nativeStoreUrl = !canDetectInstalledApps()
    ? undefined
    : Platform.OS === 'ios'
      ? apps?.ios?.store_id
        ? `itms-apps://apps.apple.com/app/id${apps.ios.store_id}`
        : undefined
      : apps?.android?.package
        ? `market://details?id=${apps.android.package}`
        : undefined;

  if (nativeStoreUrl) {
    try {
      const canOpen = await Linking.canOpenURL(nativeStoreUrl);
      if (canOpen) {
        await Linking.openURL(nativeStoreUrl);
        return true;
      }
    } catch {
      // Fall through to https below.
    }
  }

  const httpsUrl = getStoreUrl(shop);
  if (httpsUrl) {
    try {
      await Linking.openURL(httpsUrl);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
