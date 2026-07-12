/**
 * Custom brand icons for shops NOT available in the `simple-icons` package.
 *
 * Some brands (BP, Cropp, House, OMV, SPAR, Slovnaft, Bauer, ...) are not part
 * of Simple Icons, and the favicon-fetch fallback returns tiny/generic or wrong
 * icons for them. To guarantee a correct, crisp, offline logo we ship hand-made
 * single-colour SVG glyphs here.
 *
 * Each entry mirrors the shape of a Simple Icons record:
 *   { path: <SVG path data, viewBox "0 0 24 24">, hex: <brand colour>, title }
 *
 * The path is drawn monochrome and coloured at runtime with the shop's
 * `text_color` on top of its `primary_color` tile (see ShopIcon.tsx).
 *
 * Reference these from a shop YAML via `brand.logo: <key>` (e.g. `siBp`).
 * They are merged into brand-icons.generated.ts by generate-brand-icons.js.
 */

module.exports = {
  // BP — Helios "sunburst" mark (simplified, single colour).
  siBp: {
    title: 'BP',
    hex: '009B3A',
    path:
      'M12 0l1.6 4.9 3.9-3.3-1.2 5 4.9-1.6-3.3 3.9L24 12l-4.9 1.6 3.3 3.9-5-1.2 1.6 4.9-3.9-3.3L12 24l-1.6-4.9-3.9 3.3 1.2-5L2.8 20.9l3.3-3.9L0 12l4.9-1.6L1.6 6.5l5 1.2L4.9 2.8l3.9 3.3L12 0zm0 6a6 6 0 100 12 6 6 0 000-12z',
  },

  // Cropp — bold "C" letter mark.
  siCropp: {
    title: 'Cropp',
    hex: 'FF6600',
    path:
      'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c2.9 0 5.51-1.235 7.334-3.207l-2.94-2.717A5.5 5.5 0 1112 6.5c1.62 0 3.078.7 4.086 1.815l2.94-2.717A9.977 9.977 0 0012 2z',
  },

  // House — simple house/roof glyph.
  siHouse: {
    title: 'House',
    hex: 'FFFFFF',
    path:
      'M12 2.1L1 12h3v9h6v-6h4v6h6v-9h3L12 2.1zM12 5l6 5.4V19h-2v-6H8v6H6v-8.6L12 5z',
  },

  // OMV — three interlocking "flame" arcs (stylised).
  siOMV: {
    title: 'OMV',
    hex: '004899',
    path:
      'M6 3l3 6-3 6-3-6 3-6zm12 0l3 6-3 6-3-6 3-6zM12 9l3 6-3 6-3-6 3-6z',
  },

  // SPAR — the fir-tree emblem (single colour silhouette).
  siSpar: {
    title: 'SPAR',
    hex: '009639',
    path:
      'M12 1l3.4 5.1-1.6.3 3 4.4-1.5.2 3.2 4.7H12v3h-0.001v-3H3.5l3.2-4.7-1.5-.2 3-4.4-1.6-.3L12 1z',
  },

  // Slovnaft — MOL-group flame droplet.
  siSlovnaft: {
    title: 'Slovnaft',
    hex: 'E30613',
    path:
      'M12 2c0 4-6 6-6 11a6 6 0 0012 0c0-5-6-7-6-11zm0 6.5c1.9 2 3 3.2 3 4.9a3 3 0 11-6 0c0-1.6 1.2-3 3-4.9z',
  },

  // MOL — MOL Group flame droplet (same family mark as Slovnaft).
  siMol: {
    title: 'MOL',
    hex: '009640',
    path:
      'M12 2c0 4-6 6-6 11a6 6 0 0012 0c0-5-6-7-6-11zm0 6.5c1.9 2 3 3.2 3 4.9a3 3 0 11-6 0c0-1.6 1.2-3 3-4.9z',
  },

  // Bauer — "B" letter mark.
  siBauer: {

    title: 'Bauer',
    hex: 'E2001A',
    path:
      'M5 3h8a4.5 4.5 0 013.1 7.76A4.75 4.75 0 0114 21H5V3zm3.2 3v4.2H12a2.1 2.1 0 100-4.2H8.2zm0 7.2V18H13a2.4 2.4 0 100-4.8H8.2z',
  },
};
