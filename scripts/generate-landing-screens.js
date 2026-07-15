#!/usr/bin/env node
/**
 * Generate lightweight, brand-consistent "screenshot" mockups for the marketing
 * landing page (`landing/`). These are illustrative SVG phone frames (not real
 * captures) so the landing page has visuals without shipping large PNGs or
 * requiring a device farm. Run:  node scripts/generate-landing-screens.js
 *
 * Output: landing/assets/screen-cards.svg, screen-barcode.svg, screen-add.svg
 *         and a copy of the app icon at landing/assets/icon.svg
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'landing', 'assets');
fs.mkdirSync(OUT, { recursive: true });

const W = 390;
const H = 844;
const VIOLET = '#7C3AED';
const INDIGO = '#4338CA';

// Phone frame + status bar + bottom home indicator, wrapping arbitrary content.
function frame(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="brand" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${VIOLET}"/>
      <stop offset="1" stop-color="${INDIGO}"/>
    </linearGradient>
    <clipPath id="screen"><rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="46"/></clipPath>
  </defs>
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="54" fill="#0b0b12"/>
  <rect x="10" y="10" width="${W - 20}" height="${H - 20}" rx="46" fill="#ffffff"/>
  <g clip-path="url(#screen)">
    ${inner}
    <!-- status bar -->
    <text x="34" y="44" font-family="Arial" font-size="15" font-weight="700" fill="#1e1b2e">9:41</text>
    <rect x="${W - 78}" y="30" width="22" height="12" rx="3" fill="#1e1b2e"/>
    <rect x="${W - 50}" y="30" width="16" height="12" rx="3" fill="#1e1b2e"/>
  </g>
  <rect x="${W / 2 - 60}" y="26" width="120" height="26" rx="13" fill="#0b0b12"/>
  <rect x="${W / 2 - 55}" y="${H - 26}" width="110" height="5" rx="2.5" fill="#c8c8d0"/>
</svg>`;
}

function barcode(x, y, w, h, dark = '#1e1b2e') {
  const widths = [3, 2, 5, 2, 4, 2, 6, 3, 2, 5, 2, 3, 6, 2, 4, 2, 5, 3, 2, 4, 6, 2, 3, 5, 2, 4];
  let cx = x;
  let out = '';
  for (const bw of widths) {
    out += `<rect x="${cx}" y="${y}" width="${bw}" height="${h}" fill="${dark}"/>`;
    cx += bw + 3;
    if (cx > x + w) break;
  }
  return out;
}

// Escape XML special characters. SVGs are loaded via <img>, which parses them
// as strict XML — a bare "&" (e.g. in "H&M") is a fatal parse error and makes
// the whole image render blank, so every dynamic text value must be escaped.
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// A single list row: coloured chip + name + subtitle.
function row(y, color, letter, name, sub) {
  return `
    <rect x="26" y="${y}" width="${W - 52}" height="76" rx="16" fill="#ffffff" stroke="#e7e4f0"/>
    <rect x="40" y="${y + 14}" width="48" height="48" rx="12" fill="${color}"/>
    <text x="64" y="${y + 46}" font-family="Arial" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle">${esc(letter)}</text>
    <text x="104" y="${y + 34}" font-family="Arial" font-size="17" font-weight="700" fill="#1e1b2e">${esc(name)}</text>
    <text x="104" y="${y + 56}" font-family="Arial" font-size="13" fill="#8b869c">${esc(sub)}</text>
    ${barcode(W - 150, y + 30, 96, 20, '#c9c6d6')}`;
}


// 1) Card list
const cards = frame(`
  <rect x="0" y="0" width="${W}" height="${H}" fill="#f4f3fa"/>
  <rect x="0" y="0" width="${W}" height="120" fill="url(#brand)"/>
  <text x="26" y="96" font-family="Arial" font-size="26" font-weight="800" fill="#ffffff">My Cards</text>

  ${row(150, '#E4002B', 'H', 'H&M', 'Fashion')}
  ${row(238, '#0B57A4', 'T', 'Tesco Clubcard', 'Groceries')}
  ${row(326, '#0046AA', 'P', 'Payback', 'Rewards')}

  ${row(414, '#00843D', 'S', 'Starbucks', 'Café')}
  ${row(502, '#111111', 'N', 'Nike', 'Sports')}
  <circle cx="${W - 60}" cy="${H - 70}" r="30" fill="url(#brand)"/>
  <text x="${W - 60}" y="${H - 60}" font-family="Arial" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">+</text>
`);

// 2) Card detail — branded header, barcode card, and the "open in official app"
// affordance (info banner + button) that the real CardDetailScreen shows for
// shops that have a native app. Keep this in sync with that screen.
const bc = frame(`
  <rect x="0" y="0" width="${W}" height="${H}" fill="#f4f3fa"/>

  <!-- Branded header -->
  <rect x="0" y="0" width="${W}" height="250" fill="#E4002B"/>
  <circle cx="${W / 2}" cy="120" r="40" fill="#ffffff"/>
  <text x="${W / 2}" y="134" font-family="Arial" font-size="30" font-weight="800" fill="#E4002B" text-anchor="middle">H&amp;M</text>
  <text x="${W / 2}" y="200" font-family="Arial" font-size="24" font-weight="800" fill="#ffffff" text-anchor="middle">H&amp;M</text>

  <!-- Barcode card -->
  <rect x="26" y="286" width="${W - 52}" height="220" rx="18" fill="#ffffff" stroke="#e7e4f0"/>
  <g transform="translate(${W / 2 - 120}, 320)">${barcode(0, 0, 240, 110)}</g>
  <text x="${W / 2}" y="470" font-family="monospace" font-size="18" fill="#1e1b2e" text-anchor="middle">1111 1111 1111</text>


  <!-- "App available" info banner (matches CardDetailScreen) -->
  <rect x="26" y="528" width="${W - 52}" height="70" rx="12" fill="#EAF3FF" stroke="#B9D8FF"/>
  <circle cx="52" cy="563" r="11" fill="none" stroke="#0A5BBF" stroke-width="2"/>
  <text x="52" y="568" font-family="Arial" font-size="13" font-weight="800" fill="#0A5BBF" text-anchor="middle">i</text>
  <text x="76" y="556" font-family="Arial" font-size="12.5" fill="#0A5BBF">This retailer has an official app with</text>
  <text x="76" y="574" font-family="Arial" font-size="12.5" fill="#0A5BBF">extra features. Open or install it below.</text>

  <!-- "Open app" button -->
  <rect x="26" y="616" width="${W - 52}" height="56" rx="12" fill="#ffffff" stroke="#007AFF"/>
  <circle cx="150" cy="644" r="9" fill="#007AFF"/>
  <text x="176" y="650" font-family="Arial" font-size="16" font-weight="700" fill="#007AFF">Open app</text>
`);


// 3) Add card form
const add = frame(`
  <rect x="0" y="0" width="${W}" height="${H}" fill="#f4f3fa"/>
  <rect x="0" y="0" width="${W}" height="120" fill="url(#brand)"/>

  <text x="26" y="96" font-family="Arial" font-size="26" font-weight="800" fill="#ffffff">Add Card</text>
  <text x="30" y="170" font-family="Arial" font-size="13" font-weight="700" fill="#8b869c">SHOP</text>
  <rect x="26" y="182" width="${W - 52}" height="56" rx="14" fill="#ffffff" stroke="#e7e4f0"/>
  <rect x="40" y="196" width="28" height="28" rx="8" fill="#E4002B"/>
  <text x="82" y="216" font-family="Arial" font-size="16" font-weight="700" fill="#1e1b2e">H&amp;M</text>
  <text x="30" y="280" font-family="Arial" font-size="13" font-weight="700" fill="#8b869c">CARD NUMBER</text>
  <rect x="26" y="292" width="${W - 52}" height="56" rx="14" fill="#ffffff" stroke="#e7e4f0"/>
  <text x="42" y="326" font-family="monospace" font-size="16" fill="#1e1b2e">1111 1111 1111</text>

  <text x="30" y="390" font-family="Arial" font-size="13" font-weight="700" fill="#8b869c">NICKNAME (OPTIONAL)</text>
  <rect x="26" y="402" width="${W - 52}" height="56" rx="14" fill="#ffffff" stroke="#e7e4f0"/>
  <rect x="26" y="${H - 120}" width="${W - 52}" height="58" rx="16" fill="url(#brand)"/>
  <text x="${W / 2}" y="${H - 83}" font-family="Arial" font-size="18" font-weight="800" fill="#ffffff" text-anchor="middle">Save Card</text>
`);

fs.writeFileSync(path.join(OUT, 'screen-cards.svg'), cards);
fs.writeFileSync(path.join(OUT, 'screen-barcode.svg'), bc);
fs.writeFileSync(path.join(OUT, 'screen-add.svg'), add);

// Copy the app icon so the landing page is self-contained.
fs.copyFileSync(path.join(ROOT, 'assets', 'icon.svg'), path.join(OUT, 'icon.svg'));

console.log('✅ Landing screens written to landing/assets/');
