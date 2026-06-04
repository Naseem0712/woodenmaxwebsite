/**
 * Fix Product JSON-LD for Google product rich results (windows category):
 * - City pages: headline → name, brand/sku/url
 * - Guide pages missing offers: add AggregateOffer band
 * - Legacy product pages: wrong total ₹ → per sqft band
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLUSTER = path.join(ROOT, 'products/aluminium-windows');

const CITY_SLUGS = new Set([
  'aluminium-window-price-bangalore',
  'aluminium-window-price-chandigarh',
  'aluminium-window-price-delhi',
  'aluminium-window-price-mumbai',
  'aluminium-window-price-pune',
  'aluminium-window-price-vijayawada',
  'aluminium-window-price-visakhapatnam',
  'aluminium-window-price-warangal',
]);

const PRICE_FROM_TITLE = {
  '2-track-aluminium-window-price': [1200, 1400],
  '2-track-french-sliding-door': [1850, 2250],
  '3-track-sliding-window': [550, 950],
  '4-track-sliding-window-price': [650, 1200],
  'aluminium-casement-window-price': [750, 1050],
  'aluminium-sliding-window': [1200, 1400],
  'aluminium-system-window-price': [1180, 2680],
  'aluminium-system-window-brands-india': [1250, 2950],
  'aluminium-window-glass-price-breakdown': [550, 2250],
  'aluminium-window-price-per-sqft': [550, 2250],
  'aluminium-sliding-window-price-calculator': [550, 2250],
  'best-aluminium-window-for-home': [550, 2250],
  'french-door-georgian-bar': [1850, 2250],
  'full-elevation-villa-facade': [700, 4400],
  'georgian-grill-casement-door': [1350, 1850],
  'sliding-vs-casement-window': [550, 1400],
  'slim-aluminium-window-price-luxury': [900, 1500],
  'slim-entrance-glass-door': [1350, 1850],
  'slim-system-window-price': [1350, 3000],
  'slimline-aluminium-window': [900, 1400],
  'system-casement-window-price': [1280, 2920],
  'system-sliding-window-price': [1200, 2780],
  'system-window-for-villa': [1300, 3000],
  'system-window-glass-options': [1190, 2880],
  'system-window-installation': [1150, 2650],
  'system-window-vs-normal-window': [1160, 2720],
  'top-hung-casement-window': [750, 1050],
  'what-is-aluminium-system-window': [1220, 2850],
};

function parsePricesFromTitle(html) {
  const m = html.match(/<title>[^₹]*₹(\d+)[–-](\d+)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10)];
  return null;
}

function slugToSku(slug) {
  return 'WM-SEO-' + slug.replace(/-/g, '').toUpperCase().slice(0, 24);
}

function buildOffers(slug, lo, hi, cityBand) {
  const url = `https://woodenmax.in/products/aluminium-windows/${slug}`;
  if (cityBand) {
    return {
      '@type': 'AggregateOffer',
      url,
      priceCurrency: 'INR',
      lowPrice: 550,
      highPrice: 2250,
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-12-31',
      description:
        'Indicative ₹/sqft band for aluminium windows in this city; final rate after site measurement.',
    };
  }
  return {
    '@type': 'AggregateOffer',
    url,
    priceCurrency: 'INR',
    lowPrice: lo,
    highPrice: hi,
    offerCount: 1,
    availability: 'https://schema.org/InStock',
    priceValidUntil: '2026-12-31',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      priceCurrency: 'INR',
      unitCode: 'SQFT',
      unitText: 'per square foot',
      minPrice: lo,
      maxPrice: hi,
    },
  };
}

function fixProduct(o, slug, html) {
  const url = `https://woodenmax.in/products/aluminium-windows/${slug}`;
  const band = PRICE_FROM_TITLE[slug] || parsePricesFromTitle(html) || [550, 2250];
  const [lo, hi] = band;
  let changed = false;

  if (CITY_SLUGS.has(slug)) {
    if (!o.name && o.headline) {
      o.name = o.headline;
      delete o.headline;
      changed = true;
    }
    delete o.author;
    delete o.publisher;
    delete o.datePublished;
    delete o.dateModified;
    delete o.mainEntityOfPage;
    if (!o.brand) {
      o.brand = { '@type': 'Brand', name: 'WoodenMax', url: 'https://woodenmax.in' };
      changed = true;
    }
    if (!o.sku) {
      o.sku = slugToSku(slug);
      changed = true;
    }
    if (!o.category) {
      o.category = 'Aluminium Windows';
      changed = true;
    }
    if (!o.manufacturer) {
      o.manufacturer = { '@type': 'Organization', name: 'WoodenMax' };
      changed = true;
    }
    o.offers = buildOffers(slug, lo, hi, true);
    changed = true;
    return { o, changed };
  }

  if (!o.name && o.headline) {
    o.name = o.headline;
    delete o.headline;
    changed = true;
  }

  const needsOffers = !o.offers;
  const badPrice =
    o.offers &&
    typeof o.offers.lowPrice === 'number' &&
    o.offers.lowPrice > 1500;

  if (needsOffers || badPrice) {
    o.offers = buildOffers(slug, lo, hi, false);
    delete o.offers.hasMerchantReturnPolicy;
    delete o.offers.shippingDetails;
    changed = true;
  } else if (o.offers) {
    const curLo = o.offers.lowPrice;
    if (curLo !== lo || o.offers.highPrice !== hi) {
      o.offers.lowPrice = lo;
      o.offers.highPrice = hi;
      if (o.offers.priceSpecification) {
        o.offers.priceSpecification.minPrice = lo;
        o.offers.priceSpecification.maxPrice = hi;
      }
      if (!o.offers.url) o.offers.url = url;
      changed = true;
    }
  }

  if (!o.brand) {
    o.brand = { '@type': 'Brand', name: 'WoodenMax', url: 'https://woodenmax.in' };
    changed = true;
  }
  if (!o.sku && !CITY_SLUGS.has(slug)) {
    o.sku = slugToSku(slug);
    changed = true;
  }

  return { o, changed };
}

function processFile(file) {
  const slug = path.basename(file, '.html');
  let html = fs.readFileSync(file, 'utf8');
  let fileChanged = false;

  html = html.replace(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    (full, inner) => {
      let o;
      try {
        o = JSON.parse(inner.trim());
      } catch {
        return full;
      }
      if (o['@type'] !== 'Product') return full;
      const { o: fixed, changed } = fixProduct(o, slug, html);
      if (!changed) return full;
      fileChanged = true;
      const pretty = JSON.stringify(fixed, null, 2);
      const indent = full.match(/\n(\s+)</) ? full.match(/\n(\s+)</)[1] : '  ';
      return `<script type="application/ld+json">\n${pretty.split('\n').map((l, i) => (i === 0 ? l : indent + l)).join('\n')}\n${indent}</script>`;
    }
  );

  if (fileChanged) {
    fs.writeFileSync(file, html, 'utf8');
    console.log('updated:', slug);
  }
}

const files = fs.readdirSync(CLUSTER).filter((f) => f.endsWith('.html'));
for (const f of files) {
  processFile(path.join(CLUSTER, f));
}
console.log('Done. Run: node tools/audit-window-product-snippet.cjs');
