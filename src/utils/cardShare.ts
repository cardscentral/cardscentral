/**
 * Single-card sharing via a self-contained link.
 *
 * A loyalty card is tiny and only references a `shopId` that already ships with
 * the app, so we can encode one card into a compact, URL-safe payload and carry
 * it in the link's `#fragment`. Using the fragment (rather than a query string)
 * keeps the card data client-side only — it is never sent to the server / logs.
 *
 * The recipient opens the link in the (P)WA; the app decodes the payload and
 * offers to add the card. This is a manual, point-in-time copy — it doubles as
 * "manual sync" across your own devices and as sharing across users. It is NOT
 * live sync (later edits/deletions do not propagate); that is what the optional
 * backend `/v1/sync` is for.
 */

import { LoyaltyCard } from '../types';

/** A single transferable card. ids/timestamps are re-minted on import. */
export interface SharedCard {
  shopId: string;
  cardNumber: string;
  nickname?: string;
  notes?: string;
}

/** Only the fields worth transferring — ids/timestamps are re-minted on import. */
export interface SharedCardPayload extends SharedCard {
  /** payload version, so we can evolve the format later */
  v: 1;
  /** who shared it (optional) — surfaced as `sharedBy` on the recipient's copy */
  sharedBy?: string;
}

/**
 * Multi-card payload (v2). Doubles as a backup/restore format: it carries only
 * the fields we need (shop id + card number + optional nickname/notes), which
 * keeps links short. Cards are stored positionally to shave bytes further:
 * `[shopId, cardNumber, nickname, notes]` (trailing empties trimmed).
 */
export interface SharedCardsPayload {
  v: 2;
  /** who shared it (optional) — applied as `sharedBy` to every imported card */
  sharedBy?: string;
  cards: SharedCard[];
}

/** A payload can carry one card (v1) or many (v2). */
export type AnySharedPayload = SharedCardPayload | SharedCardsPayload;

/** Positional tuple used in the compact v2 wire format. */
type CardTuple = [string, string, string?, string?];


/** Fragment key used in the share URL: https://…/app/#import=<payload> */
export const SHARE_FRAGMENT_KEY = 'import';

/**
 * Base URL of the running app (web) used to build shareable links. On native we
 * still fall back to the public PWA URL so a shared link always resolves
 * somewhere the recipient can open.
 */
const DEFAULT_APP_URL = 'https://cardscentral.github.io/app/';

// ---------------------------------------------------------------------------
// base64url helpers (work in browsers and RN/Hermes without Buffer)
// ---------------------------------------------------------------------------

function toBase64Url(input: string): string {
  const utf8 = encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  );
  // btoa exists in browsers and in Hermes/React Native's global.
  const b64 = typeof btoa === 'function' ? btoa(utf8) : globalThis.btoa(utf8);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  let padded = b64;
  while (padded.length % 4 !== 0) {
    padded += '=';
  }
  const bin = typeof atob === 'function' ? atob(padded) : globalThis.atob(padded);
  // Reverse the UTF-8 round-trip performed in toBase64Url.
  let percentEncoded = '';
  for (let i = 0; i < bin.length; i += 1) {
    percentEncoded += '%' + ('00' + bin.charCodeAt(i).toString(16)).slice(-2);
  }
  return decodeURIComponent(percentEncoded);
}


// ---------------------------------------------------------------------------
// encode / decode
// ---------------------------------------------------------------------------

/** Serialize a card into the compact payload used in a share link. */
export function encodeCardPayload(card: LoyaltyCard, sharedBy?: string): string {
  const payload: SharedCardPayload = {
    v: 1,
    shopId: card.shopId,
    cardNumber: card.cardNumber,
    ...(card.nickname ? { nickname: card.nickname } : {}),
    ...(card.notes ? { notes: card.notes } : {}),
    ...(sharedBy ? { sharedBy } : {}),
  };
  return toBase64Url(JSON.stringify(payload));
}

/**
 * Decode a share payload back into a `SharedCardPayload`. Returns `null` for any
 * malformed / unsupported input so callers can fail gracefully.
 */
export function decodeCardPayload(encoded: string): SharedCardPayload | null {
  try {
    const obj = JSON.parse(fromBase64Url(encoded)) as Partial<SharedCardPayload>;
    if (
      !obj ||
      obj.v !== 1 ||
      typeof obj.shopId !== 'string' ||
      typeof obj.cardNumber !== 'string' ||
      obj.shopId.length === 0 ||
      obj.cardNumber.length === 0
    ) {
      return null;
    }
    return {
      v: 1,
      shopId: obj.shopId,
      cardNumber: obj.cardNumber,
      nickname: typeof obj.nickname === 'string' ? obj.nickname : undefined,
      notes: typeof obj.notes === 'string' ? obj.notes : undefined,
      sharedBy: typeof obj.sharedBy === 'string' ? obj.sharedBy : undefined,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// multi-card (v2) — also used as a lightweight backup/restore format
// ---------------------------------------------------------------------------

function toTuple(c: SharedCard): CardTuple {
  const tuple: CardTuple = [c.shopId, c.cardNumber, c.nickname || '', c.notes || ''];
  // Trim trailing empty fields to keep the payload compact.
  while (tuple.length > 2 && !tuple[tuple.length - 1]) {
    tuple.pop();
  }
  return tuple;
}

function fromTuple(t: unknown): SharedCard | null {
  if (!Array.isArray(t) || typeof t[0] !== 'string' || typeof t[1] !== 'string') return null;
  if (!t[0] || !t[1]) return null;
  return {
    shopId: t[0],
    cardNumber: t[1],
    nickname: typeof t[2] === 'string' && t[2] ? t[2] : undefined,
    notes: typeof t[3] === 'string' && t[3] ? t[3] : undefined,
  };
}

/** Serialize many cards into a compact, URL-safe payload (v2). */
export function encodeCardsPayload(cards: SharedCard[], sharedBy?: string): string {
  const wire: { v: 2; s?: string; c: CardTuple[] } = {
    v: 2,
    ...(sharedBy ? { s: sharedBy } : {}),
    c: cards.map(toTuple),
  };
  return toBase64Url(JSON.stringify(wire));
}

/**
 * Decode any supported payload (v1 single card or v2 multi-card) into a
 * normalized `SharedCardsPayload`. Returns `null` for malformed input.
 */
export function decodeAnyPayload(encoded: string): SharedCardsPayload | null {
  // First try the single-card (v1) format for backward compatibility.
  const single = decodeCardPayload(encoded);
  if (single) {
    return {
      v: 2,
      sharedBy: single.sharedBy,
      cards: [
        {
          shopId: single.shopId,
          cardNumber: single.cardNumber,
          nickname: single.nickname,
          notes: single.notes,
        },
      ],
    };
  }
  try {
    const obj = JSON.parse(fromBase64Url(encoded)) as { v?: number; s?: string; c?: unknown };
    if (!obj || obj.v !== 2 || !Array.isArray(obj.c)) return null;
    const cards: SharedCard[] = [];
    for (const raw of obj.c) {
      const card = fromTuple(raw);
      if (card) cards.push(card);
    }
    if (cards.length === 0) return null;
    return {
      v: 2,
      sharedBy: typeof obj.s === 'string' ? obj.s : undefined,
      cards,
    };
  } catch {
    return null;
  }
}

/** Build the base app URL (own origin on web, public PWA URL otherwise). */
function appBaseUrl(): string {
  if (
    typeof window !== 'undefined' &&
    window.location &&
    typeof window.location.href === 'string'
  ) {
    return window.location.origin + window.location.pathname;
  }
  return DEFAULT_APP_URL;
}

/** Build the full shareable URL for many cards (v2). */
export function buildCardsShareUrl(cards: SharedCard[], sharedBy?: string): string {
  const encoded = encodeCardsPayload(cards, sharedBy);
  const base = appBaseUrl();
  const sep = base.indexOf('#') >= 0 ? '&' : '#';
  return `${base}${sep}${SHARE_FRAGMENT_KEY}=${encoded}`;
}

/** Build the full shareable URL for a card. */
export function buildShareUrl(card: LoyaltyCard, sharedBy?: string): string {
  const encoded = encodeCardPayload(card, sharedBy);
  let base = DEFAULT_APP_URL;

  // On web, prefer the app's own origin+path so links keep working on qa/ etc.
  if (
    typeof window !== 'undefined' &&
    window.location &&
    typeof window.location.href === 'string'
  ) {
    base = window.location.origin + window.location.pathname;
  }
  const sep = base.indexOf('#') >= 0 ? '&' : '#';

  return `${base}${sep}${SHARE_FRAGMENT_KEY}=${encoded}`;
}

/**
 * Extract a share payload from a URL (or bare fragment) if present. Accepts both
 * `https://…/#import=xyz` and a raw `#import=xyz` / `import=xyz` fragment.
 */
export function extractSharePayload(urlOrFragment: string | null | undefined): string | null {
  if (!urlOrFragment) return null;
  const hashIndex = urlOrFragment.indexOf('#');
  const fragment = hashIndex >= 0 ? urlOrFragment.slice(hashIndex + 1) : urlOrFragment;
  for (const part of fragment.split('&')) {
    const [key, value] = part.split('=');
    if (key === SHARE_FRAGMENT_KEY && value) {
      return value;
    }
  }
  return null;
}

/** Read the current window's URL for a share payload (web only). Safe no-op on native. */
export function getSharePayloadFromLocation(): string | null {
  if (typeof window === 'undefined' || !window.location) return null;
  return extractSharePayload(window.location.hash || window.location.href);
}

/** Remove the `#import=…` fragment from the address bar without reloading (web only). */
export function clearShareFragment(): void {
  if (typeof window === 'undefined' || !window.history || !window.location) return;
  const clean = window.location.origin + window.location.pathname + window.location.search;
  window.history.replaceState(null, '', clean);
}
