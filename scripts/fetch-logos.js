#!/usr/bin/env node
/**
 * Fetch brand logos for shops during build.
 *
 * For shops that have a Simple Icons SVG logo, this is skipped.
 * For shops with a `domain` field but no `brand.logo`, this fetches a logo PNG.
 *
 * Sources tried in order (first genuine PNG wins):
 *   1. Google favicon service at 256px  (https://www.google.com/s2/favicons)
 *   2. DuckDuckGo icon service           (https://icons.duckduckgo.com/ip3/)
 *
 * Both services return a generic placeholder for domains they don't know:
 *   - Google returns HTTP 404 with a fixed ~726-byte "globe" PNG.
 *   - DuckDuckGo returns HTTP 404 with a fixed ~1478-byte placeholder PNG.
 * We reject those (by HTTP status AND by a checksum/size denylist) so shops
 * without a real logo cleanly fall back to the 2-letter abbreviation.
 *
 * Usage: node scripts/fetch-logos.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const yaml = require('js-yaml');
const https = require('https');

const SHOPS_DIR = path.join(__dirname, '..', 'src', 'config', 'shops');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'logos');

// Known generic-placeholder checksums returned by the icon services when they
// have no real logo for a domain. Anything matching these must be rejected.
const PLACEHOLDER_MD5 = new Set([
  'b8a0bf372c762e966cc99ede8682bc71', // Google "globe" 726B placeholder
  'ab1fb25b83d4b333ea661a84bd298b2e', // DuckDuckGo 1478B "no icon" placeholder
]);


function md5(buffer) {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// Google's favicon service returns whatever the site serves — often a JPEG,
// GIF or ICO, not a PNG. Writing those bytes to a `.png` file breaks the
// Android *release* build: AAPT validates image content and rejects a `.png`
// that is really a JPEG ("file failed to compile"). iOS doesn't run AAPT, so
// it tolerated the mismatch and only Android failed. Detect the real format
// from the magic bytes so we can keep only genuine PNGs.
function detectExtension(buffer) {
  if (buffer.length >= 8 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  if (buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  if (buffer.length >= 6 && buffer.toString('ascii', 0, 3) === 'GIF') {
    return 'gif';
  }
  return null;
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fetch a URL, following redirects, and resolve with { status, buffer }.
function httpGet(url, redirects = 3) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        resolve(httpGet(next, redirects - 1));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks) }));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Convert a non-PNG image buffer (JPEG/WEBP/GIF) to PNG using macOS `sips`.
// Android's AAPT rejects a `.png` that is really a JPEG, so genuine logos that
// happen to be served as JPEG (e.g. Billa) must be transcoded rather than
// dropped. Returns a PNG buffer, or throws if conversion isn't possible.
let sipsAvailable;
function haveSips() {
  if (sipsAvailable === undefined) {
    try {
      execFileSync('sips', ['--help'], { stdio: 'ignore' });
      sipsAvailable = true;
    } catch (_) {
      sipsAvailable = false;
    }
  }
  return sipsAvailable;
}

function convertToPng(buffer, ext) {
  if (!haveSips()) {
    throw new Error(`served as ${ext} and no converter (sips) available`);
  }
  const tmpIn = path.join(os.tmpdir(), `logo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
  const tmpOut = tmpIn.replace(new RegExp(`\\.${ext}$`), '.png');
  try {
    fs.writeFileSync(tmpIn, buffer);
    execFileSync('sips', ['-s', 'format', 'png', tmpIn, '--out', tmpOut], { stdio: 'ignore' });
    return fs.readFileSync(tmpOut);
  } finally {
    for (const f of [tmpIn, tmpOut]) {
      if (fs.existsSync(f)) { try { fs.unlinkSync(f); } catch (_) {} }
    }
  }
}

// Validate the response and return a genuine, non-placeholder PNG buffer.
// Non-PNG raster formats are transcoded to PNG. Throws with a reason on failure.
function toValidPng({ status, buffer }) {
  if (status !== 200) {
    throw new Error(`HTTP ${status}`);
  }
  if (buffer.length < 100) {
    throw new Error(`too small (${buffer.length}B)`);
  }
  if (PLACEHOLDER_MD5.has(md5(buffer))) {
    throw new Error('generic placeholder icon');
  }
  const ext = detectExtension(buffer);
  if (ext === 'png') {
    return buffer;
  }
  if (ext === 'jpg' || ext === 'webp' || ext === 'gif') {
    return convertToPng(buffer, ext);
  }
  throw new Error(`unsupported image format (${ext || 'unknown'})`);
}

// Try each source in order; return the first genuine PNG buffer.
async function fetchLogo(domain) {
  const sources = [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${domain}.png`,
  ];

  let lastErr;
  for (const url of sources) {
    try {
      const res = await httpGet(url);
      return toValidPng(res);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('no source produced a logo');
}

async function main() {
  const yamlFiles = fs.readdirSync(SHOPS_DIR).filter(f => f.endsWith('.yaml'));

  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  for (const file of yamlFiles) {
    const filePath = path.join(SHOPS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const config = yaml.load(content);

    const outputFile = path.join(OUTPUT_DIR, `${config.id}.png`);

    // Shops with a Simple Icons SVG logo don't need a favicon.
    if (config.brand && config.brand.logo) {
      skipped++;
      continue;
    }

    // Skip if already fetched and not stale (less than 7 days old).
    if (fs.existsSync(outputFile)) {
      if (process.env.FETCH_LOGOS_SKIP_STALE === '1') {
        skipped++;
        continue;
      }
      const stat = fs.statSync(outputFile);
      const age = Date.now() - stat.mtimeMs;
      if (age < 7 * 24 * 60 * 60 * 1000) {
        skipped++;
        continue;
      }
    }

    if (!config.domain) {
      skipped++;
      continue;
    }

    try {
      const buffer = await fetchLogo(config.domain);
      fs.writeFileSync(outputFile, buffer);
      fetched++;
      process.stdout.write(`✓ ${config.id} (${buffer.length}B)\n`);
    } catch (err) {
      // No genuine logo available — remove any stale/placeholder file so the
      // app falls back to the letter icon instead of showing a globe.
      if (fs.existsSync(outputFile)) {
        try { fs.unlinkSync(outputFile); } catch (_) {}
      }
      failed++;
      errors.push(`${config.id} (${config.domain}): ${err.message}`);
    }

    // Rate limit between requests
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n✅ Fetched ${fetched} logos, skipped ${skipped}, no-logo ${failed}`);
  if (errors.length > 0) {
    console.warn('No genuine logo (using letter fallback):');
    errors.forEach(e => console.warn(`  ⚠️  ${e}`));
  }

  generateLogoIndex();
}

function generateLogoIndex() {
  const logos = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => f.replace('.png', ''));

  const output = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * 
 * Index of available logo images.
 * Run "npm run fetch:logos" to refresh.
 *
 * Generated at: ${new Date().toISOString()}
 */

// Maps shop ID to require() for the logo PNG asset
export const logoAssets: Record<string, any> = {
${logos.map(id => `  "${id}": require("../../assets/logos/${id}.png"),`).join('\n')}
};
`;

  const indexPath = path.join(__dirname, '..', 'src', 'config', 'logo-assets.generated.ts');
  fs.writeFileSync(indexPath, output);
  console.log(`✅ Generated logo index with ${logos.length} entries`);
}

main().catch(console.error);
