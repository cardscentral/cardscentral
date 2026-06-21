#!/usr/bin/env node
/**
 * Fetch brand logos from Google's favicon service during build.
 *
 * For shops that have a Simple Icons SVG logo, this is skipped.
 * For shops with a `domain` field but no `brand.logo`, this fetches
 * a 128x128 favicon PNG from Google and saves it locally.
 *
 * Source: https://www.google.com/s2/favicons?domain=DOMAIN&sz=128
 * No API key required.
 *
 * Usage: node scripts/fetch-logos.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const https = require('https');

const SHOPS_DIR = path.join(__dirname, '..', 'src', 'config', 'shops');
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'logos');

// Google's favicon service returns whatever the site serves — often a JPEG,
// GIF or ICO, not a PNG. Writing those bytes to a `.png` file breaks the
// Android *release* build: AAPT validates image content and rejects a `.png`
// that is really a JPEG ("file failed to compile"). iOS doesn't run AAPT, so
// it tolerated the mismatch and only Android failed. Detect the real format
// from the magic bytes so we can keep only genuine PNGs (see writeIfPng).

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
  // ICO / unknown — Android can't compile these, so signal a skip.
  return null;
}


// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Only write the file if the downloaded bytes are a real PNG. We store every
// logo as `.png` (the generated index + ShopIcon both assume PNG), so a JPEG
// or ICO served by the favicon endpoint must NOT be written — it would build
// on iOS but fail AAPT on Android. Shops without a valid PNG simply fall back
// to the 2-letter abbreviation in ShopIcon, so skipping is safe.
function writeIfPng(buffer, outputPath) {
  if (buffer.length < 100) {
    throw new Error(`Too small (${buffer.length} bytes)`);
  }
  const ext = detectExtension(buffer);
  if (ext !== 'png') {
    throw new Error(`Not a PNG (got ${ext || 'unknown'}); skipping to keep Android AAPT happy`);
  }
  fs.writeFileSync(outputPath, buffer);
  return buffer.length;
}

function fetchFavicon(domain, outputPath) {
  return new Promise((resolve, reject) => {
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    https.get(url, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (res) => {
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            try {
              resolve(writeIfPng(Buffer.concat(chunks), outputPath));
            } catch (err) {
              reject(err);
            }
          });
          res.on('error', reject);
        }).on('error', reject);
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        try {
          resolve(writeIfPng(Buffer.concat(chunks), outputPath));
        } catch (err) {
          reject(err);
        }
      });
      response.on('error', reject);
    }).on('error', reject);
  });
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
    
    // Skip if already fetched and not stale (less than 7 days old).
    //
    // In CI the logos directory is restored from an actions/cache keyed on the
    // shop YAML hashes, so a present file is already up to date for that key —
    // re-fetching ~100 favicons over the network adds several minutes per run
    // for no benefit. Set FETCH_LOGOS_SKIP_STALE=1 (the CI workflows do) to
    // skip purely on existence and avoid that network round-trip.
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
    
    // Need domain to fetch
    if (!config.domain) {
      skipped++;
      continue;
    }
    
    try {
      const size = await fetchFavicon(config.domain, outputFile);
      fetched++;
      process.stdout.write(`✓ ${config.id} (${size}B)\n`);
    } catch (err) {
      failed++;
      errors.push(`${config.id}: ${err.message}`);
    }
    
    // Rate limit: 50ms between requests
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n✅ Fetched ${fetched} logos, skipped ${skipped}, failed ${failed}`);
  if (errors.length > 0) {
    console.warn('Failures:');
    errors.forEach(e => console.warn(`  ⚠️  ${e}`));
  }

  // Generate a TypeScript index of available logos
  generateLogoIndex();
}

function generateLogoIndex() {
  const logos = fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => f.replace('.png', ''));

  const output = `/**
 * AUTO-GENERATED - DO NOT EDIT
 * 
 * Index of available logo images fetched from Google Favicons.
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
