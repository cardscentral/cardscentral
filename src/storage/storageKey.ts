/**
 * storageKey
 *
 * Central helper for building AsyncStorage keys that are namespaced per
 * deployment *stage*.
 *
 * Why this exists: the web PWA is hosted for prod and QA on the SAME origin,
 * only under different base paths:
 *   - Prod: https://cardscentral.github.io/app/
 *   - QA:   https://cardscentral.github.io/qa/
 * On the web, AsyncStorage is backed by `localStorage`, which is keyed by
 * ORIGIN (not path). That means /app/ and /qa/ would otherwise share the exact
 * same storage — so testing something on QA would clobber the user's real cards
 * on prod. To keep them isolated we prefix every stored key with a stage
 * namespace derived from the current URL.
 *
 * Design goals:
 *   - Prod + native are UNCHANGED: they keep the historical `@cardscentral/…`
 *     keys, so existing users' data (cards, country, theme, …) is preserved.
 *   - Only the QA stage gets a distinct prefix (`@cardscentral/qa/…`), giving it
 *     a fully separate sandbox that never touches production data.
 */

import { Platform } from 'react-native';

/** Deployment stages that get their own isolated storage sandbox. */
type Stage = 'default' | 'qa';

/**
 * Detect the deployment stage from the current web URL.
 *
 * Prod (`/app/`) and native both map to `default` (historical, unprefixed
 * keys). Only a `/qa/` base path maps to the isolated `qa` sandbox. Anything
 * unexpected falls back to `default` so we never accidentally strand a user's
 * data behind a mystery namespace.
 */
function detectStage(): Stage {
  if (Platform.OS !== 'web') return 'default';
  if (typeof window === 'undefined' || !window.location) return 'default';

  const path = window.location.pathname || '';
  // Match a `/qa` or `/qa/…` segment anywhere at the start of the path.
  if (/^\/qa(\/|$)/.test(path)) return 'qa';

  return 'default';
}

// Computed once at module load — the base path can't change without a full
// page reload, so there's no need to re-evaluate it per call.
const STAGE = detectStage();

/**
 * The namespace prefix applied to every stored key for the current stage.
 * `''` for prod/native (keys stay as-is); `'qa/'` for the QA sandbox.
 */
export const STORAGE_NAMESPACE = STAGE === 'qa' ? 'qa/' : '';

/**
 * Build a stage-namespaced AsyncStorage key.
 *
 * @example
 *   storageKey('cards')  // prod/native → '@cardscentral/cards'
 *   storageKey('cards')  // qa          → '@cardscentral/qa/cards'
 */
export function storageKey(name: string): string {
  return `@cardscentral/${STORAGE_NAMESPACE}${name}`;
}
