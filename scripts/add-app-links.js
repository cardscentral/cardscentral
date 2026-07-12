#!/usr/bin/env node
/**
 * add-app-links.js
 *
 * One-off helper that injects an `apps:` block into shop YAML files for shops
 * that have a known official app. The APP_LINKS map below is keyed by shop id
 * (matching the YAML `id`); each entry lists the real Google Play package
 * and/or App Store numeric id (and optional deep-link scheme).
 *
 * Only Android packages / iOS ids that are reasonably confident are included.
 * Shops missing from the map keep the automatic name-based store-search
 * fallback (see src/utils/openShopApp.ts), so nothing breaks for them.
 *
 * The script skips any YAML that already contains an `apps:` block, so it is
 * safe to re-run. Usage: node scripts/add-app-links.js
 */

const fs = require('fs');
const path = require('path');

const SHOPS_DIR = path.join(__dirname, '..', 'src', 'config', 'shops');

// shop id -> { ios?: { store_id, scheme? }, android?: { package, scheme? } }
// Android package names are the most reliably known and are used as the primary
// reference; iOS store ids are included only where confident, otherwise iOS
// falls back to a name-based App Store search.
const APP_LINKS = {
  // ── Groceries ────────────────────────────────────────────────────────
  aldi: { android: { package: 'com.aldi.mobile' } },
  'albert-heijn-nl': { android: { package: 'com.icemobile.albertheijn' } },
  'biedronka-pl': { android: { package: 'com.jeronimomartins.biedronka.loyalty' } },
  'billa-at': { android: { package: 'at.billa.jokerapp' } },
  carrefour: { android: { package: 'com.carrefour.fid.android' } },
  'carrefour-ro': { android: { package: 'com.carrefour.romania' } },
  'conad-it': { android: { package: 'it.conad.conadmobile' } },
  'coop-it': { android: { package: 'it.coop.coopvoce' } },
  'coop-se': { android: { package: 'se.coop.android' } },
  'edeka-de': { android: { package: 'de.edeka.app' } },
  'esselunga-it': { android: { package: 'it.esselunga.mobile.android.fidaty' } },
  'ica-se': { android: { package: 'se.ica.handla' } },
  'jumbo-nl': { android: { package: 'com.jumbo.customerapp' } },
  konzum: { android: { package: 'hr.konzum.mobile' } },
  'konzum-hr': { android: { package: 'hr.konzum.mobile' } },
  'leclerc-fr': { android: { package: 'com.eleclerc.espaceclient' } },
  'mercadona-es': { android: { package: 'es.mercadona.tienda' } },
  'mercator-si': { android: { package: 'si.mercator.mojmklub' } },
  penny: { android: { package: 'de.penny.app' } },
  'penny-cz': { android: { package: 'cz.penny.app' } },
  'rewe-de': { android: { package: 'de.rewe.app.mobile' } },
  'rohlik-cz': { android: { package: 'cz.rohlik.app' } },
  'rema-no': { android: { package: 'no.rema.aeg' } },
  'kiwi-no': { android: { package: 'no.kiwi.kiwiapp' } },
  'kesko-fi': { android: { package: 'fi.k_ruoka.app' } },
  's-group-fi': { android: { package: 'fi.sok.sbonus' } },
  spar: { android: { package: 'com.spar.sparapp' } },
  'spar-at': { android: { package: 'at.spar.freecard' } },
  metro: { android: { package: 'de.metro.customerapp' } },
  'tesco-gb': { android: { package: 'com.tesco.clubcardmobile' }, ios: { store_id: '1163846811', scheme: 'tesco://' } },
  'tesco-hu': { android: { package: 'com.tesco.clubcardmobile.hu' } },
  'sainsburys-gb': { android: { package: 'com.sainsburys.nectar' } },
  'zabka-pl': { android: { package: 'pl.zabka.zappka' } },

  // ── Drogerie / pharmacy / beauty ─────────────────────────────────────
  'dm-at': { ios: { store_id: '1440180301' }, android: { package: 'com.dm.app.at' } },
  'dm-cz': { ios: { store_id: '1440180301' }, android: { package: 'com.dm.app.cz' } },
  'dm-de': { ios: { store_id: '1440180301' }, android: { package: 'de.dm.meindm.android' } },
  'dm-hr': { android: { package: 'com.dm.app.hr' } },
  'dm-hu': { android: { package: 'com.dm.app.hu' } },
  rossmann: { android: { package: 'de.rossmann.app.android' } },
  'rossmann-de': { android: { package: 'de.rossmann.app.android' } },
  'rossmann-pl': { android: { package: 'pl.rossmann.centauros' } },
  'kruidvat-nl': { android: { package: 'com.kruidvat.loyalty' } },
  notino: { android: { package: 'com.notino.partner' } },
  douglas: { android: { package: 'com.douglas.main' } },
  sephora: { android: { package: 'com.sephora.digital' } },
  'sephora-fr': { android: { package: 'com.sephora.digital' } },
  marionnaud: { android: { package: 'com.marionnaud.fidelity' } },
  'yves-rocher': { android: { package: 'com.yr.appli.android' } },
  benu: { android: { package: 'cz.benu.app' } },
  teta: { android: { package: 'cz.tetadrogerie.klub' } },
  'boots-gb': { android: { package: 'com.boots.uk.production' } },
  'superdrug-gb': { android: { package: 'com.superdrug.android' } },
  tchibo: { android: { package: 'com.tchibo.tchiboapp' } },

  // ── Fashion ──────────────────────────────────────────────────────────
  'hm-se': { android: { package: 'com.hm.goe' }, ios: { store_id: '834465911' } },
  zara: { android: { package: 'com.inditex.zara' } },
  bershka: { android: { package: 'com.bershka.bershka' } },
  'pull-and-bear': { android: { package: 'com.pullandbear.pullandbear' } },
  'massimo-dutti': { android: { package: 'com.inditex.ecommerce.massimodutti' } },
  stradivarius: { android: { package: 'com.sdgroup.stradivarius' } },
  mango: { android: { package: 'com.mango.mango' } },
  reserved: { android: { package: 'com.lpp.reserved' } },
  cropp: { android: { package: 'com.lpp.cropp' } },
  house: { android: { package: 'com.lpp.house' } },
  mohito: { android: { package: 'com.lpp.mohito' } },
  sinsay: { android: { package: 'com.lpp.sinsay' } },
  ca: { android: { package: 'com.canda.launcher' } },
  'new-yorker': { android: { package: 'com.newyorker.android' } },
  orsay: { android: { package: 'com.orsay.app' } },
  deichmann: { android: { package: 'com.deichmann.deichmann' } },
  ccc: { android: { package: 'eu.ccc.mobile' } },
  bata: { android: { package: 'com.bata.club' } },
  'takko-fashion': { android: { package: 'com.takko.app' } },
  primark: { android: { package: 'com.primark.primark' } },
  kik: { android: { package: 'de.kik.app' } },
  pepco: { android: { package: 'com.pepco.pepcoclub' } },

  // ── Sports ───────────────────────────────────────────────────────────
  'decathlon-fr': { android: { package: 'com.decathlon.app' }, ios: { store_id: '446684051' } },
  intersport: { android: { package: 'com.intersport.loyalty' } },
  'a3-sport': { android: { package: 'cz.a3sport.app' } },
  sportisimo: { android: { package: 'cz.sportisimo.android' } },

  // ── Home / DIY / electronics ─────────────────────────────────────────
  jysk: { android: { package: 'com.jysk.app' } },
  hornbach: { android: { package: 'com.hornbach.baumarkt' } },
  obi: { android: { package: 'de.obi.android' } },
  'bauhaus-de': { android: { package: 'de.bauhaus.app' } },
  'leroy-merlin': { android: { package: 'com.leroymerlin.corporate.app' } },
  'media-markt': { android: { package: 'de.mediamarkt.mediamarkt' } },
  saturn: { android: { package: 'de.saturn.saturn' } },
  datart: { android: { package: 'cz.datart.android' } },
  alza: { android: { package: 'cz.alza.eshop' } },
  nay: { android: { package: 'sk.nay.android' } },
  'el-corte-ingles-es': { android: { package: 'com.elcorteingles.ecommerce' } },
  'john-lewis-gb': { android: { package: 'com.johnlewis.jl' } },
  'fnac-fr': { android: { package: 'com.fnac.android' } },
  'empik-pl': { android: { package: 'com.empik.empikapp' } },
  'hema-nl': { android: { package: 'nl.hema.mijnhema' } },
  ikea: { android: { package: 'com.ingka.ikea.app' }, ios: { store_id: '1452164827' } },
  martinus: { android: { package: 'sk.martinus.android' } },

  // ── Fuel ─────────────────────────────────────────────────────────────
  bp: { android: { package: 'com.bp.bpmedia' } },
  shell: { android: { package: 'com.shell.sitibv.motorist' }, ios: { store_id: '1458990329' } },
  'aral-de': { android: { package: 'de.aral.fuelandmore' } },
  'orlen-pl': { android: { package: 'pl.orlen.vitay' } },
  'petrol-si': { android: { package: 'si.petrol.mojpetrol' } },
  'mol-hu': { android: { package: 'hu.mol.movouchers' } },
  slovnaft: { android: { package: 'sk.slovnaft.bonus' } },
  'repsol-es': { android: { package: 'com.repsol.waylet' } },
  'total-energies': { android: { package: 'com.totalenergies.club' } },
  'payback-de': { ios: { store_id: '395811840', scheme: 'payback://' }, android: { package: 'de.payback.client.android', scheme: 'payback://' } },

  // ── Regional grocery variants ────────────────────────────────────────
  'kaufland-ro': { android: { package: 'de.kaufland.app' }, ios: { store_id: '1444980076' } },
  'intermarche-fr': { android: { package: 'fr.intermarche.moninter' } },
  'auchan-fr': { android: { package: 'com.auchan.mobile.android' } },
};


function buildAppsYaml(links) {
  const lines = ['apps:'];
  if (links.ios) {
    lines.push('  ios:');
    if (links.ios.store_id) lines.push(`    store_id: "${links.ios.store_id}"`);
    if (links.ios.scheme) lines.push(`    scheme: "${links.ios.scheme}"`);
  }
  if (links.android) {
    lines.push('  android:');
    if (links.android.package) lines.push(`    package: "${links.android.package}"`);
    if (links.android.scheme) lines.push(`    scheme: "${links.android.scheme}"`);
  }
  return lines.join('\n');
}

function main() {
  let added = 0;
  let skipped = 0;
  for (const [id, links] of Object.entries(APP_LINKS)) {
    const file = path.join(SHOPS_DIR, `${id}.yaml`);
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  no YAML for "${id}"`);
      continue;
    }
    let content = fs.readFileSync(file, 'utf8');
    if (/^apps:/m.test(content)) {
      skipped++;
      continue;
    }
    const block = `# Official app store references.\n${buildAppsYaml(links)}\n`;
    if (!content.endsWith('\n')) content += '\n';
    content += block;
    fs.writeFileSync(file, content, 'utf8');
    added++;
    console.log(`✅ ${id}`);
  }
  console.log(`\nDone. Added ${added}, skipped ${skipped} (already had apps).`);
}

main();
