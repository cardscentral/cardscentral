/**
 * Generate the Cards Central app icon (and all derived PNGs).
 *
 * Design goal: a modern, premium home-screen tile that reads instantly at small
 * sizes. A single card floats on a rich diagonal indigo→violet→fuchsia gradient
 * with a soft radial highlight for depth. The card has a fresh mint accent chip
 * and a clean rounded barcode — no tiny text, no fanned stack, no dated gold.
 *
 * Run: node scripts/generate-icon.js
 * If `rsvg-convert` (librsvg) is installed, all PNGs are exported automatically;
 * otherwise conversion hints are printed.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SIZE = 1024;
const ROOT = path.join(__dirname, '..');

// Rounded barcode bars — varied widths, generous rounding for a soft, modern feel.
const barWidths = [14, 8, 20, 10, 8, 18, 10, 24, 8, 14, 10];
let barX = 0;
const bars = barWidths
  .map((w) => {
    const rect = `<rect x="${barX}" y="0" width="${w}" height="150" rx="${Math.min(w, 8) / 2 + 2}" fill="#4338CA"/>`;
    barX += w + 16;
    return rect;
  })
  .join('\n        ');
const barcodeWidth = barX - 16;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Rich diagonal brand gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6D28D9"/>
      <stop offset="55%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#DB2777"/>
    </linearGradient>
    <!-- Soft top-left highlight for depth -->
    <radialGradient id="glow" cx="28%" cy="22%" r="80%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.28"/>
      <stop offset="55%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <!-- Subtle card sheen -->
    <linearGradient id="cardSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#EEF2FF"/>
    </linearGradient>
    <!-- Mint accent -->
    <linearGradient id="chip" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
    <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="26" stdDeviation="34" flood-color="#1E1B4B" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Modern squircle background -->
  <rect width="${SIZE}" height="${SIZE}" rx="248" fill="url(#bg)"/>
  <rect width="${SIZE}" height="${SIZE}" rx="248" fill="url(#glow)"/>

  <!-- One bold card, gentle tilt, soft shadow -->
  <g transform="translate(512, 520) rotate(-5)" filter="url(#cardShadow)">
    <!-- Card body -->
    <rect x="-320" y="-210" width="640" height="420" rx="60" fill="url(#cardSheen)"/>

    <!-- Mint accent chip (top-left), like a smart-card contact pad -->
    <rect x="-268" y="-150" width="120" height="92" rx="22" fill="url(#chip)"/>
    <rect x="-236" y="-150" width="8" height="92" fill="#0EA5A0" opacity="0.35"/>
    <rect x="-268" y="-110" width="120" height="8" fill="#0EA5A0" opacity="0.35"/>

    <!-- Brand dot -->
    <circle cx="250" cy="-104" r="34" fill="#DB2777"/>

    <!-- Clean rounded barcode -->
    <g transform="translate(${-barcodeWidth / 2}, 30)">
        ${bars}
    </g>
  </g>
</svg>`;

const svgPath = path.join(ROOT, 'assets', 'icon.svg');
fs.writeFileSync(svgPath, svg);
console.log(`✅ Icon SVG written to: ${svgPath}`);

// --- Auto-export PNGs if rsvg-convert (librsvg) is available -----------------
function rsvg(outPath, size) {
  execFileSync('rsvg-convert', ['-w', String(size), '-h', String(size), svgPath, '-o', outPath]);
  console.log(`   ↳ ${path.relative(ROOT, outPath)} (${size}px)`);
}

const targets = [
  ['assets/icon.png', 1024],
  ['assets/favicon.png', 48],
  ['public/icons/icon-192.png', 192],
  ['public/icons/icon-512.png', 512],
  ['public/icons/apple-touch-icon.png', 180],
];

try {
  execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' });
  console.log('🎨 Exporting PNGs via rsvg-convert:');
  for (const [rel, size] of targets) {
    const out = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    rsvg(out, size);
  }
  console.log('✅ All icon PNGs regenerated.');
} catch {
  console.log('');
  console.log('ℹ️  rsvg-convert not found — convert manually, e.g.:');
  for (const [rel, size] of targets) {
    console.log(`  rsvg-convert -w ${size} -h ${size} assets/icon.svg -o ${rel}`);
  }
}
