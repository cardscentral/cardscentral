/**
 * Generate the Cards Central app icon (and all derived PNGs).
 *
 * Design: a recognisable *loyalty card* on a bold violet→indigo tile — a gently
 * tilted rounded card with a pink→violet top band, a gold chip, a brand dot and
 * a clean barcode. Large, high-contrast shapes so it still reads as a small
 * favicon/domain icon.
 *
 * Two variants are produced from the same artwork:
 *   1. ROUNDED (squircle) — assets/icon.svg. Used by the website, favicon and
 *      PWA icons. Its corners are transparent so it shows as a rounded tile.
 *   2. SQUARE / full-bleed OPAQUE — used only for the iOS app icon
 *      (assets/icon.png). iOS app icons must have NO alpha channel (Xcode's
 *      `actool` fails the build otherwise) and iOS masks the corners itself, so
 *      this variant fills the whole canvas and we strip any alpha on export.
 *
 * Run: node scripts/generate-icon.js
 * If `rsvg-convert` (librsvg) is installed, all PNGs are exported automatically;
 * otherwise conversion hints are printed.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SIZE = 1024;
const RADIUS = 224; // squircle corner radius for the rounded variant
const ROOT = path.join(__dirname, '..');

// Barcode bars inside the card — a few varied widths so it reads as a barcode
// while staying legible when the whole icon is scaled down to 16px.
const barWidths = [26, 14, 34, 16, 26, 14, 30];
let barX = 0;
const bars = barWidths
  .map((w) => {
    const rect = `<rect x="${barX}" y="0" width="${w}" height="150" rx="7" fill="#312E81"/>`;
    barX += w + 20;
    return rect;
  })
  .join('\n          ');
const barcodeWidth = barX - 20;

// Shared defs + foreground artwork (identical for both variants). The only
// difference between variants is the background rect's corner radius.
const DEFS = `
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#4338CA"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#EEF2FF"/>
    </linearGradient>
    <linearGradient id="band" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#DB2777"/>
      <stop offset="100%" stop-color="#7C3AED"/>
    </linearGradient>
    <linearGradient id="chip" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
      <feDropShadow dx="0" dy="22" stdDeviation="30" flood-color="#1E1B4B" flood-opacity="0.35"/>
    </filter>
  </defs>`;

const CARD = `
  <g transform="translate(512, 512) rotate(-8)" filter="url(#shadow)">
    <rect x="-340" y="-232" width="680" height="464" rx="56" fill="url(#card)"/>
    <path d="M -340 -176 A 56 56 0 0 1 -284 -232 L 284 -232 A 56 56 0 0 1 340 -176 Z" fill="url(#band)"/>
    <rect x="-286" y="-138" width="128" height="98" rx="20" fill="url(#chip)"/>
    <rect x="-286" y="-100" width="128" height="7" fill="#B45309" opacity="0.45"/>
    <rect x="-250" y="-138" width="7" height="98" fill="#B45309" opacity="0.45"/>
    <circle cx="268" cy="-176" r="34" fill="#FFFFFF" opacity="0.9"/>
    <g transform="translate(${-barcodeWidth / 2}, 40)">
          ${bars}
    </g>
  </g>`;

function makeSvg({ rounded }) {
  const bgRx = rounded ? ` rx="${RADIUS}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">${DEFS}
  <rect width="${SIZE}" height="${SIZE}"${bgRx} fill="url(#bg)"/>${CARD}
</svg>`;
}

// Canonical (rounded) icon — this is what the website + favicon + PWA use.
const svgPath = path.join(ROOT, 'assets', 'icon.svg');
fs.writeFileSync(svgPath, makeSvg({ rounded: true }));
console.log(`✅ Icon SVG (rounded) written to: ${svgPath}`);

// Square, full-bleed variant for the opaque iOS app icon.
const svgSquarePath = path.join(ROOT, 'assets', 'icon-ios.svg');
fs.writeFileSync(svgSquarePath, makeSvg({ rounded: false }));
console.log(`✅ Icon SVG (square/opaque) written to: ${svgSquarePath}`);

// --- Auto-export PNGs if rsvg-convert (librsvg) is available -----------------
function rsvg(srcSvg, outPath, size, opaque) {
  const args = ['-w', String(size), '-h', String(size)];
  if (opaque) args.push('--background-color', 'white');
  args.push(srcSvg, '-o', outPath);
  execFileSync('rsvg-convert', args);
  console.log(`   ↳ ${path.relative(ROOT, outPath)} (${size}px${opaque ? ', opaque' : ''})`);
}

// Strip the alpha channel (iOS app icon must be opaque). Prefer macOS `sips`;
// fall back to ImageMagick `convert`.
function stripAlpha(outPath) {
  try {
    execFileSync('sips', ['-s', 'format', 'png', '--setProperty', 'hasAlpha', 'no', outPath, '--out', outPath], { stdio: 'ignore' });
    return true;
  } catch {}
  try {
    execFileSync('convert', [outPath, '-background', 'white', '-alpha', 'remove', '-alpha', 'off', outPath], { stdio: 'ignore' });
    return true;
  } catch {}
  return false;
}

// [relPath, size, { opaque }] — opaque targets are rendered from the square SVG
// with alpha stripped; the rest keep the rounded (transparent-corner) look.
const targets = [
  ['assets/icon.png', 1024, { opaque: true }], // iOS app icon → must be opaque
  ['assets/favicon.png', 48, {}],
  ['public/favicon-16.png', 16, {}],
  ['public/favicon-32.png', 32, {}],
  ['public/icons/icon-192.png', 192, {}],
  ['public/icons/icon-512.png', 512, {}],
  ['public/icons/apple-touch-icon.png', 180, {}],
];

try {
  execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' });
  console.log('🎨 Exporting PNGs via rsvg-convert:');
  let ok = true;
  for (const [rel, size, opts] of targets) {
    const out = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    rsvg(opts.opaque ? svgSquarePath : svgPath, out, size, !!opts.opaque);
    if (opts.opaque && !stripAlpha(out)) ok = false;
  }
  console.log('✅ All icon PNGs regenerated.');
  if (!ok) {
    console.log('⚠️  Could not strip alpha from the iOS icon (no sips/convert). Install one so the iOS build accepts assets/icon.png.');
  }
} catch {
  console.log('');
  console.log('ℹ️  rsvg-convert not found — convert manually, e.g.:');
  console.log('  rsvg-convert -w 1024 -h 1024 --background-color white assets/icon-ios.svg -o assets/icon.png');
  console.log('  rsvg-convert -w 512  -h 512  assets/icon.svg -o public/icons/icon-512.png');
}
