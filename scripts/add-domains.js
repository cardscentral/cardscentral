#!/usr/bin/env node
/**
 * One-time helper: add domain field to YAML files that don't have one.
 * Maps shop IDs to their website domains.
 */
const fs = require('fs');
const path = require('path');

const SHOPS_DIR = path.join(__dirname, '..', 'src', 'config', 'shops');

// Domain mapping for all shops
const domainMap = {
  // Slovakia
  'hm': 'hm.com',
  'ca': 'c-and-a.com',
  'tako-fashion': 'takofashion.sk',
  'dm': 'dm-drogeriemarkt.sk',
  'lidl': 'lidl.sk',
  'tesco': 'tesco.com',
  'billa': 'billa.sk',
  'kaufland': 'kaufland.sk',
  'coop-jednota': 'jednota.sk',
  'slovnaft': 'slovnaft.sk',
  'omv': 'omv.sk',
  'ikea': 'ikea.sk',
  'deichmann': 'deichmann.com',
  'nay': 'nay.sk',
  'datart': 'datart.sk',
  'sportisimo': 'sportisimo.sk',
  'intersport': 'intersport.sk',
  'dr-max': 'drmax.sk',
  'benu': 'benu.sk',
  'teta': 'tetadrogerie.sk',
  'pepco': 'pepco.sk',
  'new-yorker': 'newyorker.de',
  'reserved': 'reserved.com',
  'sinsay': 'sinsay.com',
  'mohito': 'mohito.com',
  'cropp': 'cropp.com',
  'house': 'housebrand.com',
  'zara': 'zara.com',
  'bershka': 'bershka.com',
  'stradivarius': 'stradivarius.com',
  'pull-and-bear': 'pullandbear.com',
  'massimo-dutti': 'massimodutti.com',
  'mango': 'mango.com',
  'orsay': 'orsay.com',
  'ccc': 'ccc.eu',
  'decathlon': 'decathlon.sk',
  'douglas': 'douglas.sk',
  'muller': 'mueller.sk',
  'obi': 'obi.sk',
  'hornbach': 'hornbach.sk',
  'leroy-merlin': 'leroymerlin.sk',
  'jysk': 'jysk.sk',
  'spar': 'spar.sk',
  'alza': 'alza.sk',
  'shell': 'shell.sk',
  'bp': 'bp.com',
  'primark': 'primark.com',
  'rossmann': 'rossmann.de',
  'penny': 'penny.sk',
  'media-markt': 'mediamarkt.sk',
  'saturn': 'saturn.de',
  // Czech Republic
  'albert-cz': 'albert.cz',
  'rohlik-cz': 'rohlik.cz',
  'penny-cz': 'penny.cz',
  'dm-cz': 'dm-drogeriemarkt.cz',
  // Poland
  'biedronka-pl': 'biedronka.pl',
  'zabka-pl': 'zabka.pl',
  'rossmann-pl': 'rossmann.pl',
  'empik-pl': 'empik.com',
  'orlen-pl': 'orlen.pl',
  // Germany
  'dm-de': 'dm.de',
  'rossmann-de': 'rossmann.de',
  'rewe-de': 'rewe.de',
  'edeka-de': 'edeka.de',
  'aldi': 'aldi-nord.de',
  'aral-de': 'aral.de',
  'payback-de': 'payback.de',
  'bauhaus-de': 'bauhaus.info',
  'media-markt': 'mediamarkt.de',
  // Austria
  'billa-at': 'billa.at',
  'spar-at': 'spar.at',
  'dm-at': 'dm.at',
  // Hungary
  'dm-hu': 'dm.hu',
  'tesco-hu': 'tesco.hu',
  'mol-hu': 'mol.hu',
  // Croatia
  'dm-hr': 'dm.hr',
  'konzum-hr': 'konzum.hr',
  // Romania
  'kaufland-ro': 'kaufland.ro',
  'carrefour-ro': 'carrefour.ro',
  'carrefour': 'carrefour.com',
  // France
  'leclerc-fr': 'e.leclerc',
  'auchan-fr': 'auchan.fr',
  'fnac-fr': 'fnac.com',
  'decathlon-fr': 'decathlon.fr',
  'intermarche-fr': 'intermarche.com',
  'sephora-fr': 'sephora.fr',
  // Italy
  'conad-it': 'conad.it',
  'coop-it': 'e-coop.it',
  'esselunga-it': 'esselunga.it',
  // UK
  'tesco-gb': 'tesco.com',
  'sainsburys-gb': 'sainsburys.co.uk',
  'boots-gb': 'boots.com',
  'john-lewis-gb': 'johnlewis.com',
  'superdrug-gb': 'superdrug.com',
  // Netherlands
  'albert-heijn-nl': 'ah.nl',
  'jumbo-nl': 'jumbo.com',
  'kruidvat-nl': 'kruidvat.nl',
  'hema-nl': 'hema.com',
  // Spain
  'mercadona-es': 'mercadona.es',
  'el-corte-ingles-es': 'elcorteingles.es',
  'repsol-es': 'repsol.es',
  // Slovenia
  'mercator-si': 'mercator.si',
  'petrol-si': 'petrol.si',
  // Sweden
  'hm-se': 'hm.com',
  'ica-se': 'ica.se',
  'coop-se': 'coop.se',
  // Norway
  'kiwi-no': 'kiwi.no',
  'rema-no': 'rema.no',
  // Finland
  'kesko-fi': 'k-ruoka.fi',
  's-group-fi': 's-kanava.fi',
  // Global
  'total-energies': 'totalenergies.com',
};

const files = fs.readdirSync(SHOPS_DIR).filter(f => f.endsWith('.yaml'));

let added = 0;
for (const file of files) {
  const filePath = path.join(SHOPS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has domain
  if (content.includes('domain:')) continue;
  
  // Extract id from filename
  const id = file.replace('.yaml', '');
  const domain = domainMap[id];
  
  if (domain) {
    // Add domain after country line
    content = content.replace(
      /(country: \w+\n)/,
      `$1domain: "${domain}"\n`
    );
    fs.writeFileSync(filePath, content);
    added++;
  }
}

console.log(`✅ Added domain to ${added} YAML files`);
