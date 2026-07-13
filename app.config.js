// Dynamic Expo config.
//
// We ship the web PWA in two stages that live on the same GitHub Pages site
// under different base paths:
//   - Prod: /cardscentral      → https://<owner>.github.io/cardscentral/
//   - QA:   /cardscentral/qa    → https://<owner>.github.io/cardscentral/qa/
//
// The base path is fixed in app.json for native builds, but for the web export
// it can be overridden with the EXPO_BASE_URL env var (set by scripts/build-web.js).
// When EXPO_BASE_URL is unset we fall back to the value in app.json, so `expo
// start`, native builds, and a plain prod build all behave exactly as before.

const appJson = require('./app.json');

module.exports = ({ config }) => {
  // `config` is the resolved app.json content; keep it as the base.
  const merged = { ...(config || appJson.expo) };

  const baseUrl = process.env.EXPO_BASE_URL;
  if (baseUrl) {
    const withTrailingSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const withoutTrailingSlash = baseUrl.replace(/\/$/, '');

    merged.experiments = {
      ...(merged.experiments || {}),
      baseUrl: withoutTrailingSlash,
    };

    merged.web = {
      ...(merged.web || {}),
      startUrl: withTrailingSlash,
      scope: withTrailingSlash,
    };
  }

  return merged;
};
