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

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(outputPath, buffer);
            resolve(buffer.length);
          });
          res.on('error', reject);
        }).on('error', reject);
        return;
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 100) {
          reject(new Error(`Too small (${buffer.length} bytes)`));
          return;
        }
        fs.writeFileSync(outputPath, buffer);
        resolve(buffer.length);
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
    
    // Skip if already fetched and not stale (less than 7 days old)
    if (fs.existsSync(outputFile)) {
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
