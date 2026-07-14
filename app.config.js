// Dynamic Expo config.
//
// We ship the web PWA in two stages that live on the same GitHub Pages site
// (served at the org root, https://cardscentral.github.io/) under different
// base paths:
//   - Prod: /app   → https://cardscentral.github.io/app/
//   - QA:   /qa    → https://cardscentral.github.io/qa/
//
// IMPORTANT: `experiments.baseUrl` must ONLY ever be set for the *web* export.
// If it leaks into a native (iOS/Android) build, the React Native asset bundler
// prefixes every asset path with the baseUrl and tries to write assets to
// `<App>.app/cardscentral/assets/...`, which crashes the "Bundle React Native
// code and images" phase with `ENOTDIR: not a directory, mkdir ...`.
//
// Therefore we do NOT hardcode baseUrl in app.json. Instead the web build
// script (scripts/build-web.js) sets EXPO_BASE_URL, and only then do we apply
// it here. Native builds and `expo start` never receive a baseUrl.

const appJson = require('./app.json');

module.exports = ({ config }) => {
  // `config` is the resolved app.json content; keep it as the base.
  const merged = { ...(config || appJson.expo) };

  const baseUrl = process.env.EXPO_BASE_URL;

  // Defensively strip any inherited baseUrl so it can never reach a native
  // build; we re-add it below only when EXPO_BASE_URL is explicitly provided
  // (i.e. for a web export).
  if (merged.experiments && 'baseUrl' in merged.experiments) {
    const { baseUrl: _ignored, ...restExperiments } = merged.experiments;
    merged.experiments = restExperiments;
  }

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
