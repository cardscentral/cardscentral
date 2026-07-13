#!/usr/bin/env node
/**
 * build-web.js
 *
 * Builds the installable PWA that we host for free on GitHub Pages (so there's
 * no Apple Developer fee to reach iOS users — they "Add to Home Screen").
 *
 * We publish TWO stages of the PWA to the same GitHub Pages site:
 *   - Prod: https://<owner>.github.io/cardscentral/      (base /cardscentral/)
 *   - QA:   https://<owner>.github.io/cardscentral/qa/   (base /cardscentral/qa/)
 * The base path is configurable via the BASE_PATH env var (default is the prod
 * path). Everything that hard-codes the base path (Expo baseUrl, the manifest
 * start_url/scope/icons, and the service-worker scope) is rewritten here so a
 * single build script can produce either stage.
 *
 * Steps:
 *   1. `expo export --platform web` → produces dist/ (a single-page web build,
 *      under the configured base path). Expo copies the contents of public/
 *      (manifest, service worker, icons) into dist/.
 *   2. Inject PWA <head> tags (manifest, theme-color, apple-touch-icon) and a
 *      service-worker registration snippet into dist/index.html.
 *   3. Rewrite the base path inside manifest.webmanifest + sw.js.
 *   4. Cache-bust the service worker with the current build version.
 *   5. Write dist/404.html (GitHub Pages SPA fallback) and dist/.nojekyll.
 *
 * Usage:
 *   node scripts/build-web.js                       # prod build (/cardscentral/)
 *   BASE_PATH=/cardscentral/qa/ node scripts/build-web.js   # QA build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Normalise the base path: always leading + trailing slash (e.g. /cardscentral/).
function normalizeBase(raw) {
  let base = (raw || '/cardscentral/').trim();
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base = base + '/';
  return base;
}

const BASE = normalizeBase(process.env.BASE_PATH);
// Expo's experiments.baseUrl wants no trailing slash (e.g. /cardscentral/qa).
const BASE_URL = BASE.replace(/\/$/, '');

function run(cmd, extraEnv = {}) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...extraEnv } });
}

// 1. Regenerate shop registry + export the web bundle. We pass the base path to
//    Expo via EXPO_BASE_URL (read by app.config.js) so assets resolve correctly.
run('npm run generate:shops');
fs.rmSync(DIST, { recursive: true, force: true });
run('npx expo export --platform web', { EXPO_BASE_URL: BASE_URL });

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

// 3. Rewrite the base path in the manifest + service worker. Both files are
//    authored with the prod default (/cardscentral/); swap it for the target.
const DEFAULT_BASE = '/cardscentral/';
if (BASE !== DEFAULT_BASE) {
  const manifestPath = path.join(DIST, 'manifest.webmanifest');
  if (fs.existsSync(manifestPath)) {
    const manifest = fs
      .readFileSync(manifestPath, 'utf8')
      .split(DEFAULT_BASE)
      .join(BASE);
    fs.writeFileSync(manifestPath, manifest, 'utf8');
  }
}

// 4. Cache-bust the service worker so redeploys pick up fresh assets, and point
//    its BASE at the target stage (so QA + prod caches never collide).
const swPath = path.join(DIST, 'sw.js');
if (fs.existsSync(swPath)) {
  const version = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const sw = fs
    .readFileSync(swPath, 'utf8')
    .replace('__CACHE_VERSION__', version)
    .split(DEFAULT_BASE)
    .join(BASE);
  fs.writeFileSync(swPath, sw, 'utf8');
}

// 5. GitHub Pages: SPA fallback + disable Jekyll (so _expo/ is served as-is).
fs.copyFileSync(indexPath, path.join(DIST, '404.html'));
fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');

console.log('\n✅ PWA built to dist/ (base path ' + BASE + ')');
