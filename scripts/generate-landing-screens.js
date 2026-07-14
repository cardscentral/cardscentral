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

// A single list row: coloured chip + name + subtitle.
function row(y, color, letter, name, sub) {
  return `
    <rect x="26" y="${y}" width="${W - 52}" height="76" rx="16" fill="#ffffff" stroke="#e7e4f0"/>
    <rect x="40" y="${y + 14}" width="48" height="48" rx="12" fill="${color}"/>
    <text x="64" y="${y + 46}" font-family="Arial" font-size="22" font-weight="800" fill="#ffffff" text-anchor="middle">${letter}</text>
    <text x="104" y="${y + 34}" font-family="Arial" font-size="17" font-weight="700" fill="#1e1b2e">${name}</text>
    <text x="104" y="${y + 56}" font-family="Arial" font-size="13" fill="#8b869c">${sub}</text>
    ${barcode(W - 150, y + 30, 96, 20, '#c9c6d6')}`;
}

// 1) Card list
const cards = frame(`
  <rect x="0" y="0" width="${W}" height="${H}" fill="#f4f3fa"/>
  <rect x="0" y="0" width="${W}" height="120" fill="url(#brand)"/>
  <text x="26" y="96" font-family="Arial" font-size="26" font-weight="800" fill="#ffffff">My Cards</text>

  ${row(150, '#E4002B', 'H', 'H&M', 'Fashion')}
  ${row(238, '#0B57A4', 'T', 'Tesco Clubcard', 'Groceries')}
  ${row(326, '#F39200', 'D', 'dm', 'Pharmacy')}
  ${row(414, '#00843D', 'S', 'Starbucks', 'Café')}
  ${row(502, '#111111', 'N', 'Nike', 'Sports')}
  <circle cx="${W - 60}" cy="${H - 70}" r="30" fill="url(#brand)"/>
  <text x="${W - 60}" y="${H - 60}" font-family="Arial" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">+</text>
`);

// 2) Full-screen barcode
const bc = frame(`
  <rect x="0" y="0" width="${W}" height="${H}" fill="#E4002B"/>
  <rect x="30" y="150" width="${W - 60}" height="420" rx="28" fill="#ffffff"/>
  <text x="${W / 2}" y="210" font-family="Arial" font-size="24" font-weight="800" fill="#1e1b2e" text-anchor="middle">H&amp;M</text>
  <text x="${W / 2}" y="238" font-family="Arial" font-size="13" fill="#8b869c" text-anchor="middle">Loyalty card</text>
  <g transform="translate(${W / 2 - 130}, 300)">${barcode(0, 0, 260, 150)}</g>
  <text x="${W / 2}" y="500" font-family="monospace" font-size="18" fill="#1e1b2e" text-anchor="middle">2901 4567 8901</text>
  <text x="${W / 2}" y="620" font-family="Arial" font-size="15" font-weight="700" fill="#ffffff" text-anchor="middle">Show this at the till</text>
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
  <text x="42" y="326" font-family="monospace" font-size="16" fill="#1e1b2e">2901 4567 8901</text>
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
