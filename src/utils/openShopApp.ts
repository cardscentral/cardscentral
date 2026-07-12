/**
 * openShopApp
 *
 * Helpers for launching a shop's official app or its store listing.
 *
 * Every shop can offer a store link. Resolution precedence:
 *   1. The shop's own YAML `apps` block (the single source of truth for real
 *      App Store / Play Store references — see src/config/shops/*.yaml).
 *   2. A name-based store SEARCH url as a universal fallback, so shops with no
 *      declared app id still get an "open in App Store / Play Store" action.
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
 * True if the shop declares a *known* native app (via its YAML `apps` block)
 * for the current platform. Drives the "app available" badge and the deep-link
 * button.

 * Note: even when this is false, getStoreUrl() still returns a search link.
 */
export function hasShopApp(shop: ShopLike): boolean {
  const apps = resolveAppLinks(shop);
  if (!apps) return false;
  return Platform.OS === 'ios' ? !!apps.ios : !!apps.android;
}

/** Name-based store search url for a specific store — universal fallback. */
function getStoreSearchUrl(shop: ShopLike, store: 'ios' | 'android'): string | undefined {
  if (!shop.name) return undefined;
  const term = encodeURIComponent(shop.name);
  return store === 'ios'
    ? `https://apps.apple.com/search?term=${term}`
    : `https://play.google.com/store/search?q=${term}&c=apps`;
}

/**
 * Build the App Store (iOS) https URL for a shop: a direct listing when a
 * store id is known, otherwise a name-based search. Always returns a link.
 */
export function getAppStoreUrl(shop: ShopLike): string | undefined {
  const apps = resolveAppLinks(shop);
  if (apps?.ios?.store_id) {
    return `https://apps.apple.com/app/id${apps.ios.store_id}`;
  }
  return getStoreSearchUrl(shop, 'ios');
}

/**
 * Build the Google Play (Android) https URL for a shop: a direct listing when
 * a package is known, otherwise a name-based search. Always returns a link.
 */
export function getPlayStoreUrl(shop: ShopLike): string | undefined {
  const apps = resolveAppLinks(shop);
  if (apps?.android?.package) {
    return `https://play.google.com/store/apps/details?id=${apps.android.package}`;
  }
  return getStoreSearchUrl(shop, 'android');
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

  if (scheme) {
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
  // but only work when a concrete id/package is known.
  const nativeStoreUrl =
    Platform.OS === 'ios'
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
