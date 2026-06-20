/**
 * VoucherVault import
 *
 * Parses a JSON export produced by a self-hosted VoucherVault instance
 * (Account → "Export Data") and maps each voucher onto a LoyaltyCard.
 *
 * VoucherVault is open-source (https://github.com/Frooodle/VoucherVault), so
 * its export is a stable, documented JSON file — unlike closed apps such as
 * Klarna, which expose no public export/import API. The export is an array of
 * voucher objects; field names have varied slightly across versions, so we
 * read each value defensively from a few likely keys.
 *
 * This module is intentionally pure (no I/O) so it is easy to unit-test and so
 * the import screen can show an accurate preview before anything is persisted.
 */

import { BarcodeType, LoyaltyCard } from '../types';
import { getAllShops } from '../config/shops';
import { generateId } from '../utils/generateId';

/** Outcome of parsing a VoucherVault export. */
export interface ImportResult {
  /** Cards ready to be persisted (ids/timestamps already assigned). */
  cards: LoyaltyCard[];
  /** Number of vouchers successfully mapped. */
  imported: number;
  /** Vouchers skipped because they had no usable code. */
  skipped: number;
  /** Human-readable problems (malformed entries, etc.). */
  errors: string[];
}

/** A single VoucherVault voucher, kept loose because keys vary by version. */
type RawVoucher = Record<string, unknown>;

const FALLBACK_SHOP_ID = 'generic';

function pickString(obj: RawVoucher, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return undefined;
}

/**
 * Map a VoucherVault barcode format string onto our BarcodeType.
 * Unknown/empty formats fall back to code128 (the most widely scannable 1D
 * format), which the card detail screen can still render.
 */
export function mapBarcodeType(format: string | undefined): BarcodeType {
  switch ((format || '').toLowerCase().replace(/[^a-z0-9]/g, '')) {
    case 'ean13':
      return 'ean13';
    case 'ean8':
      return 'ean8';
    case 'code39':
      return 'code39';
    case 'qr':
    case 'qrcode':
      return 'qr';
    case 'pdf417':
      return 'pdf417';
    case 'aztec':
      return 'aztec';
    case 'code128':
    default:
      return 'code128';
  }
}

/**
 * Best-effort match of a VoucherVault merchant name onto a known shop id.
 * Falls back to the generic shop so the card still imports and renders with the
 * 2-letter abbreviation in ShopIcon.
 */
export function matchShopId(merchant: string | undefined): string {
  if (!merchant) return FALLBACK_SHOP_ID;
  const needle = merchant.trim().toLowerCase();
  if (!needle) return FALLBACK_SHOP_ID;

  const shops = getAllShops();

  // 1. Exact (case-insensitive) name or id match.
  const exact = shops.find(
    (s) => s.name.toLowerCase() === needle || s.id.toLowerCase() === needle
  );
  if (exact) return exact.id;

  // 2. Partial match either direction (e.g. "Tesco Clubcard" → "tesco").
  const partial = shops.find(
    (s) =>
      needle.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(needle)
  );
  if (partial) return partial.id;

  return FALLBACK_SHOP_ID;
}

/** Convert one raw voucher into a LoyaltyCard, or null if it has no code. */
function mapVoucher(raw: RawVoucher, now: string): LoyaltyCard | null {
  const code = pickString(raw, ['code', 'cardNumber', 'card_number', 'value', 'barcode']);
  if (!code) return null;

  const merchant = pickString(raw, ['merchant', 'name', 'title', 'store', 'shop']);
  const notes = pickString(raw, ['notes', 'note', 'description']);

  return {
    id: generateId(),
    shopId: matchShopId(merchant),
    cardNumber: code,
    nickname: merchant,
    notes,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Parse a VoucherVault export (raw JSON string or already-parsed value).
 *
 * Accepts either a bare array of vouchers or an object that wraps them under a
 * common key (`vouchers` / `data` / `items`), since exports differ by version.
 */
export function parseVoucherVaultExport(input: string | unknown): ImportResult {
  const result: ImportResult = { cards: [], imported: 0, skipped: 0, errors: [] };

  let parsed: unknown = input;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      result.errors.push('The export is empty.');
      return result;
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      result.errors.push('Not valid JSON. Paste the VoucherVault export file contents.');
      return result;
    }
  }

  let vouchers: unknown;
  if (Array.isArray(parsed)) {
    vouchers = parsed;
  } else if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    vouchers = obj.vouchers ?? obj.data ?? obj.items;
  }

  if (!Array.isArray(vouchers)) {
    result.errors.push('Unrecognized format: expected a list of vouchers.');
    return result;
  }

  const now = new Date().toISOString();
  vouchers.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') {
      result.errors.push(`Entry ${index + 1} is not a voucher object.`);
      result.skipped++;
      return;
    }
    const card = mapVoucher(entry as RawVoucher, now);
    if (card) {
      result.cards.push(card);
      result.imported++;
    } else {
      result.skipped++;
    }
  });

  return result;
}
