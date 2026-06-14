#!/usr/bin/env node
/**
 * Generate shops registry from YAML configuration files.
 *
 * This script reads all YAML files from src/config/shops/ and generates
 * a TypeScript file (src/config/shops.generated.ts) that serves as the
 * runtime shop registry.
 *
 * Usage: node scripts/generate-shops.js
 *
 * The YAML files are the single source of truth for shop configuration.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SHOPS_DIR = path.join(__dirname, '..', 'src', 'config', 'shops');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'config', 'shops.generated.ts');

function main() {
  const yamlFiles = fs.readdirSync(SHOPS_DIR).filter(f => f.endsWith('.yaml'));

  if (yamlFiles.length === 0) {
    console.error('No YAML files found in', SHOPS_DIR);
    process.exit(1);
  }

  const shops = [];

  for (const file of yamlFiles) {
    const filePath = path.join(SHOPS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const config = yaml.load(content);

    // YAML quirk: "NO" without quotes is parsed as boolean false
    // Ensure country is always a string
    if (config.country === false) config.country = 'NO';
    if (typeof config.country !== 'string') {
      config.country = String(config.country).toUpperCase();
    }

    // Validate required fields
    const required = ['id', 'name', 'description', 'country', 'category', 'barcode_type', 'brand'];
    for (const field of required) {
      if (!config[field]) {
        console.error(`Missing required field "${field}" in ${file}`);
        process.exit(1);
      }
    }

    // brand.logo or brand.icon should be present (logo preferred)
    if (!config.brand.logo && !config.brand.icon) {
      console.warn(`⚠️  ${file}: No brand.logo or brand.icon — will use letter fallback`);
    }

    shops.push(config);
  }

  // Generate TypeScript
  const output = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * Generated from YAML files in src/config/shops/
 * Run "npm run generate:shops" to regenerate.
 *
 * Generated at: ${new Date().toISOString()}
 */

import { ShopConfig } from '../types';

export const shops: Record<string, ShopConfig> = ${JSON.stringify(
    Object.fromEntries(shops.map(s => [s.id, s])),
    null,
    2
  )};
`;

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  console.log(`✅ Generated ${OUTPUT_FILE} with ${shops.length} shops`);
}

main();
