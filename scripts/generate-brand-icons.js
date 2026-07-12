#!/usr/bin/env node
/**
 * Generate brand icon paths from the simple-icons package.
 *
 * Simple Icons is the *source of truth* for shop logos — this mirrors how
 * VoucherVault renders its brand icons. For every shop we resolve a Simple
 * Icons glyph in this priority order:
 *
 *   1. Explicit `brand.logo` slug in the shop YAML (e.g. `siLidl`). Always wins.
 *   2. Auto-resolved from the shop `name`/`domain`: we normalize both and match
 *      them against every Simple Icons `title`/`slug`. This means a newly added
 *      shop whose brand exists in Simple Icons gets the official logo with zero
 *      manual wiring.
 *   3. A hand-made glyph from `custom-brand-icons.js` for brands Simple Icons
 *      doesn't carry (BP, OMV, SPAR, …).
 *
 * Shops that resolve none of the above have no Simple Icons glyph and fall back
 * (in ShopIcon) to the fetched favicon PNG and finally a letter avatar.
 *
 * Outputs `src/config/brand-icons.generated.ts`, which exports:
 *   - `brandIcons`: map of simple-icons export key → { path, hex, title }.
 *   - `resolvedShopIcons`: map of shopId → simple-icons export key (the auto/
 *     custom resolution; explicit `brand.logo` is read directly by ShopIcon).
 *
 * Usage: node scripts/generate-brand-icons.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const customIcons = require('./custom-brand-icons');

const SHOPS_DIR = path.join(__dirname, '..', 'src', 'config', 'shops');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'config', 'brand-icons.generated.ts');

// Normalize a brand string to a comparable key: lowercase, alphanumerics only.
// "Pull & Bear" → "pullbear", "Dr.Max" → "drmax", "C&A" → "ca".
function norm(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// The leftmost label of a domain, minus a leading "www." and any TLD:
// "pullandbear.com" → "pullandbear", "www.dm.de" → "dm".
function domainBrand(domain) {
  if (!domain) return '';
  const host = String(domain).replace(/^https?:\/\//, '').replace(/^www\./, '');
  return host.split('.')[0];
}

function main() {
  const yamlFiles = fs.readdirSync(SHOPS_DIR).filter((f) => f.endsWith('.yaml'));

  const simpleIcons = require('simple-icons');

  // Build a lookup from normalized title/slug → simple-icons export key so we
  // can resolve a shop by its human name or domain in O(1).
  const byNorm = new Map();
  for (const key of Object.keys(simpleIcons)) {
    const icon = simpleIcons[key];
    if (!icon || !icon.title) continue;
    // Prefer the first key that claims a normalized name (stable, alphabetical
    // export order) so resolution is deterministic across runs.
    const t = norm(icon.title);
    const s = norm(icon.slug);
    if (t && !byNorm.has(t)) byNorm.set(t, key);
    if (s && !byNorm.has(s)) byNorm.set(s, key);
  }
  // custom-brand-icons are keyed by their si* export key; index them by the
  // normalized title too so a name/domain match can reach them.
  for (const key of Object.keys(customIcons)) {
    const icon = customIcons[key];
    if (!icon || !icon.title) continue;
    const t = norm(icon.title);
    if (t && !byNorm.has(t)) byNorm.set(t, key);
  }

  // Resolve a simple-icons/custom export key for a shop, or null.
  function resolveKey(config) {
    // 1. Explicit slug wins and is read directly by ShopIcon; still record it
    //    so its glyph is emitted into brandIcons below.
    if (config.brand && config.brand.logo) return config.brand.logo;
    // Opt out of auto-resolution for shops whose name collides with an
    // unrelated Simple Icons brand (e.g. the "Fresh" JS brand vs. a grocery
    // chain). These fall through to favicon/letter instead.
    if (config.brand && config.brand.no_auto_logo) return null;
    // 2. Auto-resolve from name, then domain.

    const candidates = [norm(config.name), norm(domainBrand(config.domain))];
    for (const cand of candidates) {
      if (cand && byNorm.has(cand)) return byNorm.get(cand);
    }
    return null;
  }

  const slugsNeeded = new Set();
  const resolvedShopIcons = {}; // shopId → export key (auto/custom/explicit)

  for (const file of yamlFiles) {
    const config = yaml.load(fs.readFileSync(path.join(SHOPS_DIR, file), 'utf8'));
    const key = resolveKey(config);
    if (!key) continue;
    slugsNeeded.add(key);
    resolvedShopIcons[config.id] = key;
  }

  console.log(`Resolved Simple Icons glyphs for ${Object.keys(resolvedShopIcons).length} shops`);

  const icons = {};
  let found = 0;
  const notFound = [];

  for (const slug of slugsNeeded) {
    const icon = simpleIcons[slug];
    if (icon) {
      icons[slug] = { path: icon.path, hex: icon.hex, title: icon.title };
      found++;
    } else if (customIcons[slug]) {
      const custom = customIcons[slug];
      icons[slug] = { path: custom.path, hex: custom.hex, title: custom.title };
      found++;
    } else {
      notFound.push(slug);
    }
  }

  if (notFound.length > 0) {
    console.warn(`⚠️  ${notFound.length} brand icons not found in simple-icons:`);
    notFound.forEach((s) => console.warn(`   - ${s}`));
    // Drop unresolved keys from the shop map so ShopIcon doesn't look up a
    // missing glyph (it would just fall through, but keep the map clean).
    for (const [shopId, key] of Object.entries(resolvedShopIcons)) {
      if (notFound.includes(key)) delete resolvedShopIcons[shopId];
    }
  }

  const output = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Brand icon SVG paths extracted from simple-icons, plus the resolved
 * shopId → icon mapping. Simple Icons is the source of truth for shop logos.
 * Run "npm run generate:icons" to regenerate.
 *
 * Reference an explicit icon from a shop YAML via \`brand.logo: <key>\` (e.g.
 * \`siBp\`); otherwise the icon is auto-resolved from the shop name/domain.
 *
 * Generated at: ${new Date().toISOString()}
 * Source: https://simpleicons.org/
 * License: CC0 1.0 Universal
 */

export interface BrandIconData {
  /** SVG path data (viewBox 0 0 24 24) */
  path: string;
  /** Brand hex color (without #) */
  hex: string;
  /** Brand title */
  title: string;
}

export const brandIcons: Record<string, BrandIconData> = ${JSON.stringify(icons, null, 2)};

/** shopId → simple-icons export key (auto-resolved / custom / explicit). */
export const resolvedShopIcons: Record<string, string> = ${JSON.stringify(resolvedShopIcons, null, 2)};
`;

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(`✅ Generated ${OUTPUT_FILE} with ${found} brand icons`);
}

main();
