/**
 * persistStorage
 *
 * PWA storage hardening.
 *
 * On the web target, AsyncStorage is backed by the browser. Browsers may evict
 * that data under storage pressure, which for us means silently losing the
 * user's loyalty cards. Calling `navigator.storage.persist()` asks the browser
 * to mark our origin's storage as persistent so it won't be cleared
 * automatically (granted immediately for installed PWAs on most browsers).
 *
 * This is a no-op on native (iOS/Android), where AsyncStorage is already
 * durable, and degrades gracefully in browsers that lack the Storage API.
 */

import { Platform } from 'react-native';

type NavigatorWithStorage = Navigator & {
  storage?: {
    persist?: () => Promise<boolean>;
    persisted?: () => Promise<boolean>;
    estimate?: () => Promise<{ usage?: number; quota?: number }>;
  };
};

/**
 * Request persistent storage for the PWA so the browser won't evict the user's
 * cards. Safe to call on every startup — it resolves quickly and is idempotent.
 *
 * Returns true if storage is (now) persistent, false otherwise. On native or in
 * unsupported browsers it resolves to false without doing anything.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  if (typeof navigator === 'undefined') return false;

  const nav = navigator as NavigatorWithStorage;
  const storage = nav.storage;
  if (!storage?.persist) return false;

  try {
    // If it's already persisted, don't prompt again.
    if (storage.persisted) {
      const already = await storage.persisted();
      if (already) return true;
    }
    return await storage.persist();
  } catch {
    return false;
  }
}

/**
 * Best-effort storage usage estimate (bytes), for diagnostics/settings.
 * Returns undefined when the browser doesn't expose it or on native.
 */
export async function getStorageEstimate(): Promise<
  { usage?: number; quota?: number } | undefined
> {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return undefined;
  const storage = (navigator as NavigatorWithStorage).storage;
  if (!storage?.estimate) return undefined;
  try {
    return await storage.estimate();
  } catch {
    return undefined;
  }
}
