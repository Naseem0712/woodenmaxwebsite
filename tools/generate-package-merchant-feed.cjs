/**
 * Generate Google Shopping package SKUs from live products.json + mirror.json
 * using the same formulas as js/standard-size-packages.js
 *
 * Landing links ALWAYS resolve to an existing .html page (via product-landing-map).
 * Rows without a real landing are skipped — never emit soft-404 Shopping URLs.
 *
 * Outputs:
 *   products-packages-feed.csv  — package-only rows
 *   Merges into products-feed.csv by REPLACING prior standard-size-package rows
 *
 * Run: node tools/generate-package-merchant-feed.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, buildProductLandingMap, landingExists } = require('./product-landing-map.cjs');

const SITE = 'https://woodenmax.in';
const BRAND = 'Woodenmax';

const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
const mirror = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'mirror.json'), 'utf8'));
const globalRates = products.globalRates || {};
const siteRates = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'rates.json'), 'utf8'));
const { byId: LANDING_BY_ID } = buildProductLandingMap();

function mergeProduct(p) {
  const rates = JSON.parse(JSON.stringify(p.rates || {}));
  if (rates.useGlobalRates && globalRates) {
    if (globalRates.glass) {
      rates.glass = Object.assign({}, globalRates.glass, rates.glass || {});
      Object.keys(p.rates.glass || {}).forEach((k) => {
        if (p.rates.glass[k] === 0) rates.glass[k] = globalRates.glass[k];
      });
    }
    if (globalRates.mesh) {
      if (!rates.mesh) rates.mesh = Object.assign({}, globalRates.mesh);
      else if (typeof rates.mesh === 'object') rates.mesh = Object.assign({}, globalRates.mesh, rates.mesh);
    }
  }
  return Object.assign({}, p, { rates });
}

const ctx = {
  window: null,
  document: {
    readyState: 'complete',
    addEventListener() {},
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() { return { setAttribute() {}, appendChild() {}, style: {} }; },
    head: { appendChild() {} },
    body: null
  },
  location: { href: SITE + '/', pathname: '/' },
  setTimeout,
  clearTimeout,
  fetch: undefined
};
ctx.window = ctx;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'standard-size-packages.js'), 'utf8'), ctx);
const api = ctx.WMStandardPackages;
if (!api) {
  console.error('WMStandardPackages failed to load');
  process.exit(1);
}
if (typeof api.setRates === 'function') api.setRates(siteRates);

function slugId(parts) {
  let id = parts.join('-').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').slice(0, 50);
  if (id.length >= 50) {
    const crypto = require('crypto');
    id = id.slice(0, 40) + '-' + crypto.createHash('md5').update(parts.join('|')).digest('hex').slice(0, 8);
  }
  return id;
}

function band(price) {
  if (price < 400) return 'budget';
  if (price < 1000) return 'mid';
  if (price < 2200) return 'premium';
  return 'luxury';
}

/** Real crawlable landing only — never products.json slug if HTML missing */
function productLink(p) {
  const landing = LANDING_BY_ID[p.id];
  if (!landing || !landingExists(landing)) return null;
  return SITE + landing;
}

function imageFor(cat) {
  const map = {
    'aluminium-windows': SITE + '/images/products/Window%20Price%20Per%20Sqft/sliding-window-price-range-india-1200.webp',
    'shower-partitions': SITE + '/images/products/Glass%20Shower%20Partition%20Price/glass-shower-partition-modern-bathroom-1200.webp',
    'metal-louvers': SITE + '/images/products/Window%20Price%20Per%20Sqft/sliding-window-price-range-india-1200.webp',
    'glass-railing': SITE + '/images/products/Window%20Price%20Per%20Sqft/sliding-window-price-range-india-1200.webp',
    'mirror-profiles': SITE + '/images/products/mirror-profiles/aluminium-mirror-profile-price-per-foot-india.webp'
  };
  return map[cat] || map['aluminium-windows'];
}

const FIELDNAMES = [
  'id', 'title', 'description', 'link', 'image_link', 'additional_image_link',
  'availability', 'price', 'sale_price', 'condition', 'brand', 'gtin', 'mpn',
  'identifier_exists', 'google_product_category', 'product_type', 'category',
  'shipping', 'shipping_weight', 'custom_label_0', 'custom_label_1',
  'custom_label_2', 'custom_label_3', 'custom_label_4'
];

function meshSkuPart(pkg) {
  if (pkg.kind === 'window') return pkg.withMesh ? 'mesh' : 'nomesh';
  if (pkg.kind === 'duct-shaft') {
    return (pkg.ductTrap ? 'trap' : 'notrap') + 'f' + ((pkg.size && pkg.size.floors) || 1);
  }
  if (pkg.kind === 'pergola-glass' || pkg.kind === 'pergola-louver') {
    return 'cl' + String((pkg.size && pkg.size.clearance) || '9');
  }
  return pkg.mode || 'std';
}

function rowFromPkg(p, pkg, link) {
  const price = Math.max(1, Math.round(pkg.amount));
  const sz = pkg.size || {};
  const sizePart = pkg.areaSqft
    ? pkg.areaSqft + 'sqft'
    : (pkg.kind === 'duct-shaft'
      ? sz.w + 'x' + ((sz.floors || 1) + 'fl')
      : (sz.w + 'x' + sz.h));
  const fid = slugId([p.id, sizePart, meshSkuPart(pkg), pkg.withProfile ? 'prof' : '', pkg.withLed ? 'led' : ''].filter(Boolean));
  // Unique title: include product id short tag when title would collide across series
  const title = (pkg.title + ' | ' + BRAND).slice(0, 149);
  const desc = (
    pkg.specs + '. Live package rate from WoodenMax calculator. GST 18% extra. ' +
    'Hyderabad factory. India-wide supply. Configure custom sizes on product page.'
  ).slice(0, 4990);
  return {
    id: fid,
    title,
    description: desc,
    link,
    image_link: imageFor(p.category),
    additional_image_link: '',
    availability: 'in stock',
    price: price.toFixed(2) + ' INR',
    sale_price: '',
    condition: 'new',
    brand: BRAND,
    gtin: '',
    mpn: '',
    identifier_exists: 'no',
    google_product_category: 'Hardware > Building Materials',
    product_type: 'Home & Garden > ' + (p.category || 'Products'),
    category: p.category || 'Products',
    shipping: 'IN::Standard:0.00 INR',
    shipping_weight: '',
    custom_label_0: p.category || 'package',
    custom_label_1: band(price),
    custom_label_2: 'package',
    custom_label_3: 'standard-size-package',
    custom_label_4: '2026'
  };
}

const rows = [];
const seen = new Set();
const seenTitles = new Map();
let skippedNoLanding = 0;

products.products.forEach((raw) => {
  if (raw.status && raw.status !== 'active') return;
  const p = mergeProduct(raw);
  const link = productLink(p);
  if (!link) {
    skippedNoLanding += 1;
    return;
  }
  let pkgs = [];
  try { pkgs = api.buildPackages(p) || []; } catch (e) { return; }
  pkgs.forEach((pkg) => {
    const r = rowFromPkg(p, pkg, link);
    // Deduplicate Shopping titles within feed (GMC policy)
    if (seenTitles.has(r.title)) {
      r.title = (pkg.title + ' · ' + (p.id || '') + ' | ' + BRAND).slice(0, 149);
    }
    seenTitles.set(r.title, (seenTitles.get(r.title) || 0) + 1);
    if (seen.has(r.id)) return;
    seen.add(r.id);
    rows.push(r);
  });
});

const bevel = mirror.calculators && mirror.calculators['bevel-modular'];
if (bevel) {
  const mirrorPkgs = api.buildMirrorPackages(bevel);
  const mirrorProduct = { id: 'mirror-bevel-modular', category: 'mirror-profiles', slug: 'mirror-profile-price-per-foot' };
  const link = productLink(mirrorProduct);
  if (link) {
    mirrorPkgs.forEach((pkg) => {
      const r = rowFromPkg(mirrorProduct, pkg, link);
      if (seenTitles.has(r.title)) {
        r.title = (pkg.title + ' · mirror | ' + BRAND).slice(0, 149);
      }
      seenTitles.set(r.title, (seenTitles.get(r.title) || 0) + 1);
      if (seen.has(r.id)) return;
      seen.add(r.id);
      rows.push(r);
    });
  } else {
    skippedNoLanding += 1;
  }
}

function toCsv(list) {
  const esc = (v) => {
    const s = String(v == null ? '' : v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [FIELDNAMES.join(',')];
  list.forEach((r) => {
    lines.push(FIELDNAMES.map((f) => esc(r[f])).join(','));
  });
  return lines.join('\n') + '\n';
}

const pkgPath = path.join(ROOT, 'products-packages-feed.csv');
fs.writeFileSync(pkgPath, toCsv(rows), 'utf8');
console.log('Wrote', rows.length, 'package SKUs →', path.relative(ROOT, pkgPath));
console.log('Skipped products with no HTML landing:', skippedNoLanding);

// Merge: strip previous package rows, then append fresh set
const mainPath = path.join(ROOT, 'products-feed.csv');
if (fs.existsSync(mainPath)) {
  const existing = fs.readFileSync(mainPath, 'utf8');
  const lines = existing.split(/\r?\n/).filter(Boolean);
  const header = lines[0] || FIELDNAMES.join(',');
  const body = lines.slice(1).filter((line) => {
    // Drop prior package SKUs (by label or known id patterns from package generator)
    if (/standard-size-package/.test(line)) return false;
    if (/,"package",/.test(line) && /standard-size-package/.test(line)) return false;
    return true;
  });
  const pkgLines = rows.map((r) => FIELDNAMES.map((f) => {
    const s = String(r[f] == null ? '' : r[f]);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(','));
  const merged = header + '\n' + body.join('\n') + (body.length ? '\n' : '') + pkgLines.join('\n') + '\n';
  try {
    fs.writeFileSync(mainPath, merged, 'utf8');
    console.log('Replaced package rows in products-feed.csv (+' + rows.length + ')');
  } catch (e) {
    const alt = path.join(ROOT, 'products-feed.with-packages.csv');
    fs.writeFileSync(alt, merged, 'utf8');
    console.warn('products-feed.csv locked — wrote', path.relative(ROOT, alt));
  }
}

// Write redirect suggestions for calculator slugs → real landings
const redirectLines = [];
(products.products || []).forEach((p) => {
  if (!p.slug || !p.category) return;
  const soft = '/products/' + p.category + '/' + p.slug;
  const hard = LANDING_BY_ID[p.id];
  if (!hard || soft === hard) return;
  if (!landingExists(hard)) return;
  // Only add redirect if soft slug has no HTML
  const softDisk = path.join(ROOT, soft.slice(1).replace(/\//g, path.sep) + '.html');
  if (fs.existsSync(softDisk)) return;
  redirectLines.push(soft + ' ' + hard + ' 301');
  redirectLines.push(soft + '/' + ' ' + hard + ' 301');
});
const redirectSnippet = path.join(ROOT, 'tools', '_package-slug-redirects.txt');
fs.writeFileSync(
  redirectSnippet,
  '# Auto-generated by generate-package-merchant-feed.cjs — merge into _redirects\n' +
    redirectLines.join('\n') +
    (redirectLines.length ? '\n' : ''),
  'utf8'
);
console.log('Wrote', redirectLines.length, 'redirect lines → tools/_package-slug-redirects.txt');
console.log('Done. Upload products-packages-feed.csv to Google Merchant Center.');
