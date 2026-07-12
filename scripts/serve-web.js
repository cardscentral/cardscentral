#!/usr/bin/env node
/**
 * serve-web.js
 *
 * Tiny static file server that serves the PWA build (dist/) under the same
 * base path GitHub Pages uses (/cardscentral/), with SPA fallback to
 * index.html. Used by the Playwright web E2E suite (and handy for local
 * preview) so tests hit the exact same URLs as production.
 *
 * Usage: node scripts/serve-web.js [port]   (default 4173)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'dist');
const BASE = '/cardscentral';
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/plain' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // Redirect root → base path (mirrors GitHub Pages project-page behaviour).
  if (urlPath === '/' || urlPath === '') {
    res.writeHead(302, { Location: BASE + '/' });
    return res.end();
  }

  // Everything is served under /cardscentral.
  if (!urlPath.startsWith(BASE)) return send(res, 404, 'Not found');
  let rel = urlPath.slice(BASE.length) || '/';
  if (rel === '/') rel = '/index.html';

  const filePath = path.join(ROOT, rel);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve the app shell for unknown routes.
      return fs.readFile(path.join(ROOT, 'index.html'), (e2, shell) =>
        e2 ? send(res, 404, 'Not found') : send(res, 200, shell, TYPES['.html'])
      );
    }
    send(res, 200, data, TYPES[path.extname(filePath)] || 'application/octet-stream');
  });
});

server.listen(PORT, () => {
  console.log(`Serving dist/ at http://localhost:${PORT}${BASE}/`);
});
