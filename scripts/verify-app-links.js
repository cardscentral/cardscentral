#!/usr/bin/env node
/**
 * verify-app-links
 *
 * Audits every shop's declared official-app references and checks that the
 * referenced app actually exists on its store:
 *   - Android: apps.android.package  → https://play.google.com/store/apps/details?id=<pkg>
 *   - iOS:     apps.ios.store_id      → iTunes lookup API (authoritative, JSON)
 *
 * A Play Store listing that doesn't exist responds with HTTP 404 (Google also
 * 404s the details page for unknown package ids). The iTunes lookup API returns
 * `{ resultCount: 0 }` for an unknown app id. Both are treated as INVALID.
 *
 * By default this only REPORTS. Pass --fix to also strip the invalid platform
 * refs out of the YAML (removing an emptied `apps:` block entirely), so the app
 * no longer links to a dead listing.
 *
 * Usage:
 *   node scripts/verify-app-links.js            # report only
 *   node scripts/verify-app-links.js --fix      # report + rewrite YAML
 *   node scripts/verify-app-links.js --only=android|ios
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const yaml = require('js-yaml');

const SHOPS_DIR = path.join(__dirname, '..', 'src', 'config', 'shops');

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1]; // 'android' | 'ios' | undefined

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

function get(url) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } },
      (res) => {
        const { statusCode } = res;
        let body = '';
        res.on('data', (c) => {
          // Cap body size; we only need a little for the iTunes JSON.
          if (body.length < 200000) body += c;
        });
        res.on('end', () => resolve({ statusCode, body }));
      }
    );
    req.on('error', () => resolve({ statusCode: 0, body: '' }));
    req.setTimeout(15000, () => {
      req.destroy();
      resolve({ statusCode: 0, body: '' });
    });
  });
}

// Play Store: the details page returns 404 for unknown package ids. Some valid
// listings briefly 429/5xx under load — treat only a definitive 404 as invalid;
// anything else (200, or transient error) is considered "exists / unknown".
async function checkAndroid(pkg) {
  const url = `https://play.google.com/store/apps/details?id=${encodeURIComponent(pkg)}&hl=en&gl=US`;
  const { statusCode } = await get(url);
  if (statusCode === 404) return { ok: false, statusCode };
  if (statusCode === 200) return { ok: true, statusCode };
  return { ok: null, statusCode }; // unknown / transient
}

// iOS: the iTunes lookup API is authoritative and returns JSON.
async function checkIos(storeId) {
  const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(storeId)}`;
  const { statusCode, body } = await get(url);
  if (statusCode !== 200) return { ok: null, statusCode };
  try {
    const json = JSON.parse(body);
    return { ok: json.resultCount > 0, statusCode };
  } catch {
    return { ok: null, statusCode };
  }
}

async function main() {
  const files = fs
    .readdirSync(SHOPS_DIR)
    .filter((f) => f.endsWith('.yaml'))
    .sort();

  const invalid = [];
  const unknown = [];
  let checked = 0;

  for (const file of files) {
    const full = path.join(SHOPS_DIR, file);
    const raw = fs.readFileSync(full, 'utf8');
    let data;
    try {
      data = yaml.load(raw);
    } catch (e) {
      console.error(`⚠️  ${file}: YAML parse error — skipping (${e.message})`);
      continue;
    }
    const apps = data && data.apps;
    if (!apps) continue;

    let mutated = false;

    if ((!ONLY || ONLY === 'android') && apps.android && apps.android.package) {
      checked++;
      const pkg = apps.android.package;
      const res = await checkAndroid(pkg);
      if (res.ok === false) {
        invalid.push({ file, platform: 'android', ref: pkg });
        if (FIX) {
          delete apps.android;
          mutated = true;
        }
      } else if (res.ok === null) {
        unknown.push({ file, platform: 'android', ref: pkg, statusCode: res.statusCode });
      }
    }

    if ((!ONLY || ONLY === 'ios') && apps.ios && apps.ios.store_id) {
      checked++;
      const id = apps.ios.store_id;
      const res = await checkIos(id);
      if (res.ok === false) {
        invalid.push({ file, platform: 'ios', ref: id });
        if (FIX) {
          delete apps.ios;
          mutated = true;
        }
      } else if (res.ok === null) {
        unknown.push({ file, platform: 'ios', ref: id, statusCode: res.statusCode });
      }
    }

    if (FIX && mutated) {
      // If the apps block is now empty, drop it entirely.
      if (apps && Object.keys(apps).length === 0) delete data.apps;
      // Re-serialize, preserving key order reasonably. We rewrite the whole
      // file from the parsed object; comments on the removed lines are lost by
      // design (those refs are gone), but the rest is standard YAML.
      const out = yaml.dump(data, { lineWidth: -1, noRefs: true, quotingType: '"' });
      fs.writeFileSync(full, out, 'utf8');
    }
  }

  console.log(`\nChecked ${checked} app reference(s) across ${files.length} shops.\n`);

  if (invalid.length === 0) {
    console.log('✅ No invalid store references found.');
  } else {
    console.log(`❌ ${invalid.length} INVALID reference(s)${FIX ? ' (removed)' : ''}:`);
    for (const r of invalid) console.log(`   - ${r.file} [${r.platform}] ${r.ref}`);
  }

  if (unknown.length) {
    console.log(
      `\n⚠️  ${unknown.length} reference(s) could not be verified (transient/blocked) — left as-is:`
    );
    for (const r of unknown) console.log(`   - ${r.file} [${r.platform}] ${r.ref} (HTTP ${r.statusCode})`);
  }

  if (!FIX && invalid.length) {
    console.log('\nRe-run with --fix to remove the invalid references from the YAML.');
  }

  // Non-zero exit only in report mode when invalids exist, so CI can gate on it.
  if (!FIX && invalid.length) process.exitCode = 1;
}

main();
