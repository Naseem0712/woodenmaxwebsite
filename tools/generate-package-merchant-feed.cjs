/**
 * Generate Google Shopping package SKUs from live products.json + mirror.json
 * using the same formulas as js/standard-size-packages.js
 *
 * Landing links ALWAYS resolve to an existing .html page (via product-landing-map),
 * preferring <link rel=canonical> so GMC matches the live page URL.
 * Rows without a real landing are skipped — never emit soft-404 Shopping URLs.
 *
 * Images: gallery-first (product-main-image, thumbnail data-image, Product JSON-LD),
 * then og/meta, then slug-relevant page images. Related-product card heroes are
 * stripped so sibling products do not share photos. Emits additional_image_link
 * (up to 10) for Google Merchant.
 *
 * Outputs:
 *   products-packages-feed.csv  — package-only rows
 *   Merges into products-feed.csv by REPLACING prior standard-size-package rows
 *
 * Run: npm run merchant:packages
 *      node tools/generate-package-merchant-feed.cjs
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

const EXTRA_IMAGE_CAP = 10;
const IMAGE_STOP_TOKENS = new Set([
  'price', 'india', 'aluminium', 'aluminum', 'window', 'windows', 'glass', 'door',
  'doors', 'the', 'and', 'for', 'with', 'per', 'sqft', 'rft', 'product', 'products',
  'modern', 'design', 'premium', 'home', 'bathroom', 'partition', 'partitions'
]);

/** Real crawlable landing only — prefer <link rel=canonical>, never soft-404 slugs */
function productLink(p) {
  const landing = LANDING_BY_ID[p.id];
  if (!landing || !landingExists(landing)) return null;
  const disk = path.join(ROOT, landing.replace(/^\//, '').replace(/\//g, path.sep) + '.html');
  try {
    const head = fs.readFileSync(disk, 'utf8').slice(0, 40000);
    const m = head.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    if (m && m[1]) {
      let href = m[1].trim().split('#')[0];
      if (href.startsWith('/')) href = SITE + href;
      const parsed = new URL(href);
      const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      if (host === 'woodenmax.in') {
        let pth = decodeURIComponent(parsed.pathname || '/');
        if (pth.length > 1 && pth.endsWith('/')) pth = pth.replace(/\/+$/, '');
        return SITE + pth;
      }
    }
  } catch (e) { /* fall through */ }
  return SITE + landing;
}

/** Category heroes — must be category-accurate (never reuse sliding-window for louvers/railings). */
const CATEGORY_FALLBACK_IMAGES = {
  'aluminium-windows': SITE + '/images/products/2%20Track%20Aluminium%20Window/2-track-aluminium-sliding-window-modern-home.webp',
  'shower-partitions': SITE + '/images/products/Glass%20Shower%20Partition%20Price/glass-shower-partition-modern-bathroom.webp',
  'metal-louvers': SITE + '/images/products/metal-louvers/building-exterior-aluminium-louver-cladding-india.webp',
  'glass-railing': SITE + '/images/products/balcony-glass-railing-system/luxury-balcony-glass-railing.webp',
  'mirror-profiles': SITE + '/images/products/mirror-profiles/led-aluminium-mirror-profile-bathroom-price-india.webp',
  'folding-systems': SITE + '/images/products/folding-systems/folding-aluminium-balcony-door-toughened-glass-india.webp',
  'telescope-windows': SITE + '/images/products/telescope-windows/telescopic-slim-profile-soft-close-fluted-glass-kitchen-partition.webp',
  'elevation-cladding': SITE + '/images/products/elevation-cladding/hpl-acp-elevation-house-cladding.webp',
  'grills': SITE + '/images/products/Grills/aluminium-window-grill-design-modern.webp',
  'glass-elevation': SITE + '/images/products/Glazing/architectural-glass-elevation.webp',
  'pergola': SITE + '/images/products/metal-louvers/aluminium-ceiling-louver-pergola-design.webp'
};

const DEFAULT_FEED_IMAGE = CATEGORY_FALLBACK_IMAGES['aluminium-windows'];
const imageCache = new Map(); // productId → { primary, extras }

function normalizeFeedImageUrl(raw) {
  if (!raw) return '';
  let u = String(raw).trim().replace(/\\\//g, '/').replace(/&amp;/g, '&');
  if (u.startsWith('//')) u = 'https:' + u;
  if (u.startsWith('/')) u = SITE + u;
  u = u.replace(/^http:\/\//i, 'https://').split('#')[0];
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
    if (host !== 'woodenmax.in') return '';
    if (!parsed.pathname.toLowerCase().includes('/images/')) return '';
    if (/woodenmax-logo/i.test(parsed.pathname) || /\.svg$/i.test(parsed.pathname)) return '';
    parsed.pathname = parsed.pathname
      .split('/')
      .map((seg) => {
        try { return encodeURIComponent(decodeURIComponent(seg)); } catch (e) { return encodeURIComponent(seg); }
      })
      .join('/');
    return 'https://woodenmax.in' + parsed.pathname + (parsed.search || '');
  } catch (e) {
    return '';
  }
}

function feedImageExists(url) {
  const u = normalizeFeedImageUrl(url);
  if (!u || !u.includes('/images/')) return false;
  let pathname;
  try { pathname = decodeURIComponent(new URL(u).pathname); } catch (e) { return false; }
  const rel = pathname.replace(/^\//, '').replace(/\//g, path.sep);
  const disk = path.join(ROOT, rel);
  if (fs.existsSync(disk)) return true;
  const twin = disk.replace(/-1200(\.[a-z0-9]+)$/i, '$1');
  if (twin !== disk && fs.existsSync(twin)) return true;
  const with1200 = disk.replace(/(\.[a-z0-9]+)$/i, '-1200$1');
  if (with1200 !== disk && fs.existsSync(with1200)) return true;
  return false;
}

function resolveExistingFeedImage(url) {
  const u = normalizeFeedImageUrl(url);
  if (!u) return '';
  if (!feedImageExists(u)) return '';
  let pathname;
  try { pathname = decodeURIComponent(new URL(u).pathname); } catch (e) { return u; }
  const rel = pathname.replace(/^\//, '');
  const disk = path.join(ROOT, rel.replace(/\//g, path.sep));
  if (fs.existsSync(disk)) {
    return SITE + '/' + rel.split('/').map((s) => encodeURIComponent(s)).join('/');
  }
  const twinRel = rel.replace(/-1200(\.[a-z0-9]+)$/i, '$1');
  const twinDisk = path.join(ROOT, twinRel.replace(/\//g, path.sep));
  if (fs.existsSync(twinDisk)) {
    return SITE + '/' + twinRel.split('/').map((s) => encodeURIComponent(s)).join('/');
  }
  const with1200 = rel.replace(/(\.[a-z0-9]+)$/i, '-1200$1');
  const wDisk = path.join(ROOT, with1200.replace(/\//g, path.sep));
  if (fs.existsSync(wDisk)) {
    return SITE + '/' + with1200.split('/').map((s) => encodeURIComponent(s)).join('/');
  }
  return '';
}

function dedupeImageKey(url) {
  return String(url || '').split('?')[0].replace(/-1200(\.[a-z0-9]+)$/i, '$1').toLowerCase();
}

function slugImageTokens(slug) {
  return String(slug || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !IMAGE_STOP_TOKENS.has(t));
}

function imageRelevance(url, tokens) {
  if (!tokens.length) return 0;
  let path = '';
  try { path = decodeURIComponent(new URL(url).pathname).toLowerCase(); } catch (e) { path = url.toLowerCase(); }
  let score = 0;
  tokens.forEach((t) => { if (path.includes(t)) score += 10; });
  return score;
}

function stripRelatedProductBlocks(html) {
  const s = String(html || '');
  const low = s.toLowerCase();
  const markers = [
    'class="related-products"',
    "class='related-products'",
    'related-products "',
    "related-products '",
    'class="related-product-card"',
    "class='related-product-card'"
  ];
  let cut = -1;
  markers.forEach((m) => {
    const i = low.indexOf(m);
    if (i >= 0 && (cut < 0 || i < cut)) cut = i;
  });
  return cut >= 0 ? s.slice(0, cut) : s;
}

function pushUniqueResolved(list, seen, raw) {
  const resolved = resolveExistingFeedImage(raw);
  if (!resolved) return;
  const key = dedupeImageKey(resolved);
  if (seen.has(key)) return;
  seen.add(key);
  list.push(resolved);
}

function isDedicatedGalleryPath(url) {
  let path = '';
  try { path = decodeURIComponent(new URL(url).pathname).toLowerCase(); } catch (e) { path = String(url).toLowerCase(); }
  return /-(?:pic|gallery)\//.test(path) || /\/(?:pic|gallery)\//.test(path);
}

/**
 * Gallery-first image harvest from a product landing page.
 * Prefer product-main-image, thumbnail data-image, Product JSON-LD, then og/meta.
 * Related-product cards are stripped so sibling heroes do not pollute the feed.
 */
function extractImagesFromHtml(html, slugHint) {
  const tokens = slugImageTokens(slugHint);
  const clean = stripRelatedProductBlocks(html);
  const head = clean.slice(0, 80000);
  const heroes = []; // og / twitter / image_src / preload — best primary
  const gallery = []; // product-main-image + thumbnail data-image
  const jsonLd = [];
  const rest = [];
  const seen = new Set();

  let m;
  // 1) Meta / preload heroes FIRST (canonical product photo for Merchant)
  const metaPatterns = [
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/gi,
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/gi,
    /<meta\s+name=["']image["']\s+content=["']([^"']+)["']/gi,
    /<meta\s+itemprop=["']image["']\s+content=["']([^"']+)["']/gi,
    /<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/gi,
    /<link[^>]+as=["']image["'][^>]+href=["']([^"']+)["']/gi,
    /<link[^>]+href=["']([^"']+)["'][^>]+as=["']image["']/gi
  ];
  metaPatterns.forEach((re) => {
    let mm;
    while ((mm = re.exec(head))) pushUniqueResolved(heroes, seen, mm[1]);
  });

  // 2) Live gallery: main image + thumbnail data-image
  const mainImgRe = /id=["']product-main-image["'][^>]*src=["']([^"']+)["']|src=["']([^"']+)["'][^>]*id=["']product-main-image["']/gi;
  while ((m = mainImgRe.exec(clean))) pushUniqueResolved(gallery, seen, m[1] || m[2]);
  const dataImageRe = /data-image=["']([^"']+)["']/gi;
  while ((m = dataImageRe.exec(clean))) pushUniqueResolved(gallery, seen, m[1]);
  const thumbBlockRe = /product-thumbnail-gallery[\s\S]{0,25000}/gi;
  const thumbBlocks = clean.match(thumbBlockRe) || [];
  thumbBlocks.forEach((block) => {
    const imgRe = /<img[^>]+src=["']([^"']*\/images\/[^"']+)["']/gi;
    let mm;
    while ((mm = imgRe.exec(block))) pushUniqueResolved(gallery, seen, mm[1]);
  });

  // 3) JSON-LD — extras only (often mixes sibling product URLs)
  const jsonLdImgRe = /https:\\\/\\\/woodenmax\.in\\\/images\\\/[^"\\]+|https:\/\/woodenmax\.in\/images\/[^"'\s<>]+/gi;
  while ((m = jsonLdImgRe.exec(head))) {
    pushUniqueResolved(jsonLd, seen, m[0].replace(/\\\//g, '/'));
  }

  // 4) Remaining in-page product images, scored by slug / dedicated gallery folder
  const imgSrcRe = /<(?:img|source)[^>]+(?:src|data-src|data-lazy-src)=["']([^"']*\/images\/products\/[^"']+)["']/gi;
  while ((m = imgSrcRe.exec(clean))) pushUniqueResolved(rest, seen, m[1]);

  const scoredSecondary = [...jsonLd, ...rest]
    .map((u) => ({
      u,
      score: imageRelevance(u, tokens) + (isDedicatedGalleryPath(u) ? 25 : 0)
    }))
    .filter((x) => !tokens.length || x.score > 0 || isDedicatedGalleryPath(x.u))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.u);

  const ordered = [];
  const orderSeen = new Set();
  [heroes, gallery, scoredSecondary].forEach((bucket) => {
    bucket.forEach((u) => {
      const k = dedupeImageKey(u);
      if (orderSeen.has(k)) return;
      orderSeen.add(k);
      ordered.push(u);
    });
  });
  return ordered;
}

function imagesFromLanding(landingPath, slugHint) {
  if (!landingPath) return [];
  const disk = path.join(ROOT, landingPath.replace(/^\//, '').replace(/\//g, path.sep) + '.html');
  if (!fs.existsSync(disk)) return [];
  const hint = slugHint || landingPath.split('/').pop() || '';
  return extractImagesFromHtml(fs.readFileSync(disk, 'utf8'), hint);
}

/**
 * Per-product images: gallery / data-image / JSON-LD first, then og:image,
 * then slug-relevant page images. Related-product heroes are excluded.
 * Returns { primary, extrasCsv }.
 */
function imageForProduct(p) {
  const key = p.id || p.slug || p.category || 'unknown';
  if (imageCache.has(key)) return imageCache.get(key);

  const landing = LANDING_BY_ID[p.id];
  const slugHint = p.slug || (landing ? landing.split('/').pop() : '') || p.id || '';
  const tokens = slugImageTokens(slugHint);
  const fromPage = imagesFromLanding(landing, slugHint);
  let primary = fromPage[0] || '';

  // If page hero/og is a borrowed sibling photo (low slug score) but a dedicated
  // *-pic gallery image matches this product, promote the better match.
  if (primary && fromPage.length > 1 && tokens.length) {
    const ranked = fromPage.map((u) => ({
      u,
      score: imageRelevance(u, tokens) + (isDedicatedGalleryPath(u) ? 20 : 0)
    }));
    const best = ranked.slice().sort((a, b) => b.score - a.score)[0];
    const primaryScore = ranked[0].score;
    if (best && best.score >= primaryScore + 15) primary = best.u;
  }

  if (!primary) {
    const fb = CATEGORY_FALLBACK_IMAGES[p.category] || DEFAULT_FEED_IMAGE;
    primary = resolveExistingFeedImage(fb) || fb;
  }

  const primaryKey = dedupeImageKey(primary);
  const extraClean = fromPage
    .filter((u) => dedupeImageKey(u) !== primaryKey)
    .slice(0, EXTRA_IMAGE_CAP);

  const result = {
    primary,
    extrasCsv: extraClean.join(', ')
  };
  imageCache.set(key, result);
  return result;
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
  const imgs = imageForProduct(p);
  return {
    id: fid,
    title,
    description: desc,
    link,
    image_link: imgs.primary,
    additional_image_link: imgs.extrasCsv,
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
const imgCounts = {};
rows.forEach((r) => {
  imgCounts[r.image_link] = (imgCounts[r.image_link] || 0) + 1;
});
const uniqueImgs = Object.keys(imgCounts).length;
console.log('Distinct package image_link URLs:', uniqueImgs, '(was ~3 before fix)');
Object.entries(imgCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .forEach(([u, n]) => console.log(' ', n, u.replace(SITE, '')));
const withExtras = rows.filter((r) => (r.additional_image_link || '').trim()).length;
console.log('Package rows with additional_image_link:', withExtras + '/' + rows.length);

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
