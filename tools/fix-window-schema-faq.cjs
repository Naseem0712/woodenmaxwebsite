/**
 * Hub 30 designs, schema cleanup (no fake ratings / wrong offers),
 * Live Calculator in meta, FAQ wording, remove aggregateRating.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLUSTER = path.join(ROOT, 'products/aluminium-windows');
const HUB = path.join(ROOT, 'products/aluminium-windows.html');

/** Pages that are guides/tools — Product schema should not carry AggregateOffer */
const NO_OFFER_SLUGS = new Set([
  'sliding-vs-casement-window',
  'best-aluminium-window-for-home',
  'aluminium-sliding-window-price-calculator',
  'aluminium-window-glass-price-breakdown',
  'what-is-aluminium-system-window',
  'system-window-vs-normal-window',
  'system-window-installation',
  'aluminium-system-window-brands-india',
]);

/** City pages — band only, not a single SKU */
const CITY_SLUGS = new Set([
  'aluminium-window-price-bangalore',
  'aluminium-window-price-chandigarh',
  'aluminium-window-price-delhi',
  'aluminium-window-price-hyderabad',
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

function slugFromFile(file) {
  return path.basename(file, '.html');
}

function removeAggregateRatingBlock(html) {
  // JSON-LD blocks
  html = html.replace(/,"aggregateRating":\{[^}]*\}(?=\s*[,}])/g, '');
  html = html.replace(/"aggregateRating":\s*\{[\s\S]*?\}\s*,?\s*/g, '');
  // Hub-style review array on Product
  html = html.replace(/,\s*"review"\s*:\s*\[[\s\S]*?\]\s*(?=\s*\})/g, '');
  // Visible trust badge with fake count
  html = html.replace(
    /<div class="alum-hero-trust-badge">\s*<svg[^>]*>[\s\S]*?<span><strong>127\+<\/strong> Customer Reviews<\/span>\s*<\/div>\s*/g,
    ''
  );
  return html;
}

function stripProductOffers(jsonStr) {
  try {
    const o = JSON.parse(jsonStr);
    if (o['@type'] === 'Product' && o.offers) {
      delete o.offers;
    }
    return JSON.stringify(o);
  } catch {
    return jsonStr;
  }
}

function fixProductJsonLdScript(html, slug) {
  return html.replace(
    /<script type="application\/ld\+json">(\{[^<]*"@type":"Product"[^<]*\})<\/script>/g,
    (full, inner) => {
      let json = inner;
      try {
        const o = JSON.parse(json);
        if (o['@type'] !== 'Product') return full;

        delete o.aggregateRating;
        if (Array.isArray(o.review)) delete o.review;

        if (NO_OFFER_SLUGS.has(slug)) {
          delete o.offers;
        } else if (CITY_SLUGS.has(slug)) {
          o.offers = {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: 550,
            highPrice: 2250,
            availability: 'https://schema.org/InStock',
            priceValidUntil: '2026-12-31',
            description: 'Indicative ₹/sqft band for aluminium windows in this city; final rate after site measurement.',
          };
        } else {
          const band = PRICE_FROM_TITLE[slug] || parsePricesFromTitle(html);
          if (band && o.offers) {
            const [lo, hi] = band;
            o.offers.lowPrice = lo;
            o.offers.highPrice = hi;
            if (o.offers.priceSpecification) {
              o.offers.priceSpecification.minPrice = lo;
              o.offers.priceSpecification.maxPrice = hi;
            }
            // Fix misleading 500 low
            if (o.offers.lowPrice < 550 && slug !== 'full-elevation-villa-facade') {
              o.offers.lowPrice = lo;
            }
          }
        }
        return `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
      } catch {
        return full;
      }
    }
  );
}

function ensureLiveCalculatorInMeta(html) {
  const descRe = /<meta name="description" content="([^"]*)"/i;
  const m = html.match(descRe);
  if (!m) return html;
  let d = m[1].replace(/&amp;/g, '&');
  if (!/live calculator/i.test(d)) {
    if (d.length < 130) {
      d = d.replace(/\.\s*$/, '') + '. Live calculator on page.';
    } else {
      d = d.replace(/Live [Pp]rice [Cc]alculator/i, 'Live Calculator');
    }
    const esc = d.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    html = html.replace(descRe, `<meta name="description" content="${esc}"`);
    html = html.replace(
      /<meta property="og:description" content="[^"]*"/i,
      `<meta property="og:description" content="${esc}"`
    );
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*"/i,
      `<meta name="twitter:description" content="${esc}"`
    );
  }
  // Tone down overused "instant estimates" → Live Calculator once
  html = html.replace(
    /Live calculator for instant estimates/gi,
    'Live Calculator for ₹/sqft estimates'
  );
  return html;
}

function fixFaqAndBodyCopy(html) {
  const repl = [
    [/for instant quote or contact/gi, 'via the Live Calculator on this page, or contact'],
    [/for instant quote/gi, 'with the Live Calculator'],
    [/Instant quote via live calculator/gi, 'Live Calculator on page'],
    [/Instant quote calculator/gi, 'Live Calculator'],
    [/Instant Quote/g, 'Live Calculator'],
    [/instant quotes/gi, 'Live Calculator estimates'],
    [/Use our live price calculator above for instant quote/gi, 'Use the Live Calculator above'],
    [/Use our <strong>live price calculator<\/strong> for instant quote/gi, 'Use the <strong>Live Calculator</strong>'],
    [/Use our <strong>live price calculator<\/strong> above for instant quote/gi, 'Use the <strong>Live Calculator</strong> above'],
  ];
  for (const [re, sub] of repl) html = html.replace(re, sub);
  return html;
}

function fixHub(html) {
  const hubTitle = 'Aluminium Window Price ₹550–2250/sqft | 30 Designs (2026)';
  const hubDesc =
    '30 aluminium window designs & guides from ₹550–2250/sqft. Sliding, casement, French, slim & system. Live Calculator on every page.';

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${hubTitle}</title>`);
  const dEsc = hubDesc.replace(/&/g, '&amp;');
  html = html.replace(
    /<meta name="description" content="[^"]*"/i,
    `<meta name="description" content="${dEsc}"`
  );
  html = html.replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${hubTitle}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${dEsc}"`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${hubTitle}"`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${dEsc}"`);

  html = html.replace(/Compare 9 types/gi, 'Compare 30 designs');
  html = html.replace(/Compare 9 Types/g, 'Compare 30 Designs');
  html = html.replace(/9 Types/g, '30 Designs');
  html = html.replace(/9 types/g, '30 designs');
  html = html.replace(/9 aluminium window types/gi, '30 aluminium window designs');

  html = html.replace(
    /<h1 class="alum-hero-title">[^<]*<\/h1>/,
    '<h1 class="alum-hero-title">Aluminium Window Price: 30 Designs + Live Calculator ₹550–2250/sqft</h1>'
  );
  html = html.replace(
    /Use our live calculator for instant quotes\./i,
    'Every product page includes a Live Calculator for ₹/sqft estimates.'
  );
  html = html.replace(
    /<p>Premium aluminium windows for modern designs — plus <strong>20 dedicated guides<\/strong>/,
    '<p>Premium aluminium windows for modern designs — <strong>30 designs & guides</strong>'
  );
  html = html.replace(
    /<h2>Complete Aluminium Windows Collection[^<]*<\/h2>/,
    '<h2>30 Aluminium Window Designs | Live Calculator on Every Page</h2>'
  );

  // Hub Product schema: remove fake ratings/reviews, fix prices
  html = html.replace(/"lowPrice":\s*500/g, '"lowPrice": 550');
  html = html.replace(/"highPrice":\s*1250/g, '"highPrice": 2250');
  html = html.replace(/"offerCount":\s*"10"/g, '"offerCount": "30"');
  html = removeAggregateRatingBlock(html);

  // Change misleading Product to CollectionPage for hub (keep one script block)
  html = html.replace(
    /"@type":\s*"Product",\s*\n\s*"name":\s*"Premium Aluminium Windows"/,
    '"@type": "CollectionPage",\n    "name": "Aluminium Windows — 30 Designs & Live Calculator"'
  );
  // Remove offers from CollectionPage (not a single product)
  html = html.replace(
    /"material":\s*"Aluminium \(Hindalco\/Imported Profiles\), Saint-Gobain Glass",\s*\n\s*"offers":\s*\{[\s\S]*?\},\s*\n\s*(?="aggregateRating"|"review"|"image")/,
    '"material": "Aluminium (Hindalco/Imported Profiles), Saint-Gobain Glass",\n    '
  );
  // If offers still there after aggregateRating removal
  html = html.replace(
    /,\s*"offers":\s*\{\s*"@type":\s*"AggregateOffer"[\s\S]*?"offerCount":\s*"30"\s*\}/,
    ''
  );

  return fixFaqAndBodyCopy(html);
}

// Hub file
let hubHtml = fs.readFileSync(HUB, 'utf8');
hubHtml = fixHub(hubHtml);
fs.writeFileSync(HUB, hubHtml);
console.log('✓ hub');

const files = fs.readdirSync(CLUSTER).filter((f) => f.endsWith('.html'));
for (const f of files) {
  const slug = slugFromFile(f);
  const abs = path.join(CLUSTER, f);
  let html = fs.readFileSync(abs, 'utf8');
  html = removeAggregateRatingBlock(html);
  html = fixProductJsonLdScript(html, slug);
  html = ensureLiveCalculatorInMeta(html);
  html = fixFaqAndBodyCopy(html);
  fs.writeFileSync(abs, html);
  console.log('✓', f);
}

console.log('\nDone:', files.length + 1, 'files');
