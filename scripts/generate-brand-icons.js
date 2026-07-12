#!/usr/bin/env node
/**
 * Generate brand icon paths from simple-icons package.
 *
 * This extracts SVG path data for brands referenced in shop YAML configs
 * and writes them to a TypeScript file usable at runtime.
 *
 * Usage: node scripts/generate-brand-icons.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const customIcons = require('./custom-brand-icons');

const SHOPS_DIR = path.join(__dirname, '..', 'src', 'config', 'shops');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'config', 'brand-icons.generated.ts');

function main() {
  // Read all YAML files to find brand slugs
  const yamlFiles = fs.readdirSync(SHOPS_DIR).filter(f => f.endsWith('.yaml'));
  const slugsNeeded = new Set();

  for (const file of yamlFiles) {
    const filePath = path.join(SHOPS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const config = yaml.load(content);
    if (config.brand && config.brand.logo) {
      slugsNeeded.add(config.brand.logo);
    }
  }

  console.log(`Found ${slugsNeeded.size} brand logo slugs referenced in YAML files`);

  // Load simple-icons module
  const simpleIcons = require('simple-icons');

  const icons = {};
  let found = 0;
  let notFound = [];

  for (const slug of slugsNeeded) {
    // Slugs in YAML are stored as "siHandm", "siLidl", etc. — matching the simple-icons export key
    const icon = simpleIcons[slug];
    if (icon) {
      icons[slug] = {
        path: icon.path,
        hex: icon.hex,
        title: icon.title,
      };
      found++;
    } else if (customIcons[slug]) {
      // Brand not in simple-icons — use our hand-made custom glyph so shops
      // like BP, OMV, SPAR, Slovnaft, etc. still get a correct, crisp logo
      // instead of a tiny/wrong fetched favicon.
      const custom = customIcons[slug];
      icons[slug] = {
        path: custom.path,
        hex: custom.hex,
        title: custom.title,
      };
      found++;
    } else {
      notFound.push(slug);
    }
  }


  if (notFound.length > 0) {
    console.warn(`⚠️  ${notFound.length} brand icons not found in simple-icons:`);
    notFound.forEach(s => console.warn(`   - ${s}`));
    console.warn('   These will use letter-based fallback icons.');
  }

  // Generate TypeScript
  const output = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Brand icon SVG paths extracted from simple-icons.
 * Run "npm run generate:icons" to regenerate.
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
`;

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(`✅ Generated ${OUTPUT_FILE} with ${found} brand icons`);
}

main();
