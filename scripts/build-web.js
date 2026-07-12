#!/usr/bin/env node
/**
 * build-web.js
 *
 * Builds the installable PWA that we host for free on GitHub Pages (so there's
 * no Apple Developer fee to reach iOS users — they "Add to Home Screen").
 *
 * Steps:
 *   1. `expo export --platform web` → produces dist/ (a single-page web build,
 *      with everything under the /cardscentral base path). Expo copies the
 *      contents of public/ (manifest, service worker, icons) into dist/.
 *   2. Inject PWA <head> tags (manifest, theme-color, apple-touch-icon) and a
 *      service-worker registration snippet into dist/index.html.
 *   3. Cache-bust the service worker with the current build version.
 *   4. Write dist/404.html (GitHub Pages SPA fallback) and dist/.nojekyll.
 *
 * Usage: node scripts/build-web.js   (or `make build-web`)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BASE = '/cardscentral/';

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// 1. Regenerate shop registry + export the web bundle.
run('npm run generate:shops');
fs.rmSync(DIST, { recursive: true, force: true });
run('npx expo export --platform web');

const indexPath = path.join(DIST, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 2. Inject PWA metadata + service-worker registration (once).
if (!html.includes('rel="manifest"')) {
  const head = `
    <link rel="manifest" href="${BASE}manifest.webmanifest" />
    <meta name="theme-color" content="#007AFF" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Cards" />
    <link rel="apple-touch-icon" href="${BASE}icons/apple-touch-icon.png" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('${BASE}sw.js', { scope: '${BASE}' }).catch(function () {});
        });
      }
    </script>
  `;
  html = html.replace('</head>', head + '</head>');
  fs.writeFileSync(indexPath, html, 'utf8');
}

// 3. Cache-bust the service worker so redeploys pick up fresh assets.
const swPath = path.join(DIST, 'sw.js');
if (fs.existsSync(swPath)) {
  const version = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const sw = fs.readFileSync(swPath, 'utf8').replace('__CACHE_VERSION__', version);
  fs.writeFileSync(swPath, sw, 'utf8');
}

// 4. GitHub Pages: SPA fallback + disable Jekyll (so _expo/ is served as-is).
fs.copyFileSync(indexPath, path.join(DIST, '404.html'));
fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');

console.log('\n✅ PWA built to dist/ (base path ' + BASE + ')');
