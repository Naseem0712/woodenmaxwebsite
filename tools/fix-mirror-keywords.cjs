#!/usr/bin/env node
/**
 * Consumer keyword targeting for products/mirror-profiles/*.html
 * Does NOT rename URLs or files.
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'products', 'mirror-profiles');

const PER_PIECE_TABLE = `<section class="cluster-section wm-per-piece-prices"><div class="container"><h2 class="cluster-h2">LED mirror price per piece (2026)</h2><div class="cluster-table-wrap"><table class="cluster-table"><thead><tr><th>Size</th><th>Type</th><th>Price (per piece)</th></tr></thead><tbody><tr><td>18&quot;x24&quot;</td><td>Backlit LED</td><td>₹3,500–5,500</td></tr><tr><td>24&quot;x36&quot;</td><td>Backlit LED</td><td>₹6,500–9,500</td></tr><tr><td>24&quot;x36&quot;</td><td>Touch Sensor 3-color</td><td>₹8,000–12,000</td></tr><tr><td>30&quot;x40&quot;</td><td>Premium + Defogger</td><td>₹12,000–18,000</td></tr><tr><td>Round 24&quot; dia</td><td>LED Touch</td><td>₹5,500–8,500</td></tr></tbody></table></div><p class="cluster-prose" style="margin-top:1rem"><em>Custom size? Per sqft rate ₹450–1,850 — use the calculator below.</em></p></div></section>
`;

const AGG_RATING = '"aggregateRating":{"@type":"AggregateRating","ratingValue":4.8,"reviewCount":127}';

const PAGES = {
  'index.html': {
    title: 'LED Mirror Price India ₹3,500–15,000 (2026) — Bathroom Mirror with Lights | WoodenMax',
    h1: 'LED Mirror Price India — Bathroom Mirror with Lights (2026)',
    meta: 'LED mirror price ₹3,500–15,000 per piece. Bathroom mirror with lights, backlit & touch sensor options. Fabricated & installed by WoodenMax across India. Free estimate.',
    productName: 'LED Bathroom Mirror with Lights',
  },
  'led-mirror-profile-price.html': {
    title: 'LED Mirror with Lights Price (2026) — Backlit & Touch Sensor | WoodenMax',
    h1: 'LED Mirror with Lights — Backlit & Touch Sensor (2026)',
    meta: 'LED mirror with lights price from ₹3,500/piece. Backlit bathroom mirror with touch sensor options. Live calculator & pan-India supply by WoodenMax.',
    productName: 'LED Mirror with Lights',
  },
  'backlit-mirror-profile-price.html': {
    title: 'Backlit Mirror Price India (2026) — LED Bathroom Mirror | WoodenMax',
    h1: 'Backlit LED Bathroom Mirror Price (2026)',
    meta: 'Backlit mirror price India from ₹3,500/piece. LED bathroom mirror with touch control. Live calculator, WoodenMax fabrication & installation.',
    productName: 'Backlit LED Bathroom Mirror',
  },
  'round-mirror-profile.html': {
    title: 'Round LED Mirror Price (2026) — Bathroom & Vanity | WoodenMax',
    h1: 'Round LED Mirror Price — Bathroom & Vanity (2026)',
    meta: 'Round LED mirror price from ₹5,500/piece. Slim touch bathroom mirror with lights. Live calculator — WoodenMax India.',
    productName: 'Round LED Mirror',
  },
  'touch-sensor-mirror-profile.html': {
    title: 'Touch Sensor LED Mirror Price (2026) | WoodenMax',
    h1: 'Touch Sensor LED Mirror Price (2026)',
    meta: 'Touch sensor LED mirror price from ₹8,000/piece. Bathroom mirror with lights & 3-color touch control. Live calculator by WoodenMax.',
    productName: 'Touch Sensor LED Mirror',
  },
  'motion-sensor-mirror-profile.html': {
    title: 'Motion Sensor LED Mirror Price (2026) | WoodenMax',
    h1: 'Motion Sensor LED Mirror Price (2026)',
    meta: 'Motion sensor LED mirror price from ₹9,200/piece. Auto-on bathroom mirror with lights. Luxury dual-glass options — WoodenMax.',
    productName: 'Motion Sensor LED Mirror',
  },
  'custom-mirror-profile.html': {
    title: 'Custom Height LED Mirror Price (2026) — Up to 7 ft | WoodenMax',
    h1: 'Custom Height LED Mirror — Up to 7 ft (2026)',
    meta: 'Custom LED mirror price for tall vanity panels up to 7 ft. Bathroom mirror with lights, V120/V220 options. WoodenMax live calculator.',
    productName: 'Custom Height LED Mirror',
  },
  'mirror-profile-price-per-foot.html': {
    title: 'Beveled LED Mirror Price (2026) — Glass & Frame Options | WoodenMax',
    h1: 'Beveled LED Mirror — Glass, Frame & Light Options (2026)',
    meta: 'Beveled bathroom mirror with LED add-ons from ₹3,500/piece. Glass, aluminium frame & backlit options. WoodenMax rate guide & calculator.',
    productName: 'Beveled LED Mirror',
  },
  'led-mirror-profile-delhi.html': {
    title: 'LED Mirror Price Delhi NCR (2026) — Bathroom Mirror with Lights | WoodenMax',
    h1: 'LED Mirror Price Delhi NCR — Supply & Installation (2026)',
    meta: 'LED mirror price Delhi NCR from ₹3,500/piece. Bathroom mirror with lights — supply & install by WoodenMax. Free site estimate.',
    productName: 'LED Mirror Delhi NCR',
  },
  'led-mirror-profile-hyderabad.html': {
    title: 'LED Mirror Price Hyderabad (2026) — Bathroom Mirror with Lights | WoodenMax',
    h1: 'LED Mirror Price Hyderabad — Factory Direct (2026)',
    meta: 'LED mirror price Hyderabad factory direct from ₹3,500/piece. Bathroom mirror with lights, same-week fabrication. WoodenMax.',
    productName: 'LED Mirror Hyderabad',
  },
  'wardrobe-mirror-profile.html': {
    title: 'Wardrobe LED Mirror Price (2026) — Touch Round | WoodenMax',
    h1: 'Wardrobe LED Mirror with Touch Sensor (2026)',
    meta: 'Wardrobe LED mirror price from ₹5,500/piece. Wooden-finish round bathroom mirror with lights for sliding wardrobes. WoodenMax calculator.',
    productName: 'Wardrobe LED Mirror',
  },
  'rectangular-mirror-profile.html': {
    title: 'Rectangular LED Mirror Price (2026) — Touch Sensor | WoodenMax',
    h1: 'Rectangular & Square LED Mirror Price (2026)',
    meta: 'Rectangular LED mirror price from ₹3,500/piece. Square touch bathroom mirror with lights. Live calculator — WoodenMax India.',
    productName: 'Rectangular LED Mirror',
  },
  'led-bathroom-mirror-profile.html': {
    title: 'LED Bathroom Mirror Price (2026) — Large Backlit Vanity | WoodenMax',
    h1: 'LED Bathroom Mirror Price — Large Backlit Vanity (2026)',
    meta: 'LED bathroom mirror price for large rectangle vanities from ₹6,500/piece. Backlit mirror with lights & touch options. WoodenMax.',
    productName: 'LED Bathroom Mirror',
  },
  'mirror-profile-without-led.html': {
    title: 'Aluminium Mirror Frame Price (2026) — Without LED | WoodenMax',
    h1: 'Aluminium Mirror Frame Price — Without LED (2026)',
    meta: 'Plain aluminium mirror frame from ₹450/ft. Budget bathroom mirror frame without LED — supply only or full mirror by WoodenMax.',
    productName: 'Aluminium Mirror Frame Without LED',
  },
  'aluminium-mirror-frame-designs.html': {
    title: 'Motion Sensor LED Mirror Price (2026) — Black Oval Frame | WoodenMax',
    h1: 'Black Oval Motion Sensor LED Mirror (2026)',
    meta: 'Motion sensor LED mirror with black oval frame from ₹9,200/piece. Luxury bathroom mirror with lights — WoodenMax imported design.',
    productName: 'Black Oval Motion Sensor LED Mirror',
  },
};

function escMeta(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function setTitleMeta(html, cfg) {
  const t = escMeta(cfg.title);
  const d = escMeta(cfg.meta);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${cfg.title}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${d}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${t}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${d}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${t}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${d}" />`
  );
  return html;
}

function setWebPageSchema(html, cfg) {
  return html.replace(
    /("@type": "WebPage"[\s\S]*?"name": )"[^"]*"/,
    `$1"${cfg.title.replace(/"/g, '\\"')}"`
  ).replace(
    /("@type": "WebPage"[\s\S]*?"description": )"[^"]*"/,
    `$1"${cfg.meta.replace(/"/g, '\\"')}"`
  );
}

function setH1(html, h1) {
  return html.replace(/<h1>[^<]*<\/h1>/, `<h1>${h1}</h1>`);
}

function protectPaths(html) {
  const tokens = [];
  html = html.replace(/(?:\.\.\/)?images\/products\/mirror-profiles\/[a-z0-9._-]+/gi, (m) => {
    tokens.push(m);
    return `__IMG_${tokens.length - 1}__`;
  });
  html = html.replace(/products\/mirror-profiles\/[a-z0-9-]+/gi, (m) => {
    tokens.push(m);
    return `__URL_${tokens.length - 1}__`;
  });
  html = html.replace(/mirror-profiles\//g, (m) => {
    tokens.push(m);
    return `__REL_${tokens.length - 1}__`;
  });
  html = html.replace(/silo-mirror-profiles/g, '__SILO__');
  return { html, tokens };
}

function restorePaths(html, tokens) {
  html = html.replace(/__SILO__/g, 'silo-mirror-profiles');
  html = html.replace(/__(?:IMG|URL|REL)_(\d+)__/g, (_, i) => tokens[Number(i)] || '');
  return html;
}

function consumerizeBody(html) {
  const { html: protectedHtml, tokens } = protectPaths(html);
  let out = protectedHtml;

  const reps = [
    [/Aluminium Mirror Profiles/g, 'LED Mirrors'],
    [/Aluminium mirror profiles/g, 'LED mirrors'],
    [/mirror profiles hub/gi, 'LED mirrors hub'],
    [/Mirror profiles hub/g, 'LED mirrors hub'],
    [/Mirror profiles/g, 'LED mirrors'],
    [/mirror profiles/g, 'LED mirrors'],
    [/Mirror profile/g, 'LED mirror'],
    [/mirror profile/g, 'LED mirror'],
    [/LED mirror aluminium profile/gi, 'LED bathroom mirror'],
    [/LED mirror profile/gi, 'LED mirror'],
    [/for mirror profiles/gi, 'for LED mirrors'],
    [/mirror profile calculators/gi, 'LED mirror calculators'],
    [/WoodenMax mirror profile calculators/gi, 'WoodenMax LED mirror calculators'],
    [/Is the LED mirror profile waterproof/gi, 'Is the LED bathroom mirror waterproof'],
    [/starting price for LED mirror profile per foot/gi, 'starting LED mirror price per piece'],
    [/supply only profile or complete mirror/gi, 'supply frame only or complete LED mirror'],
    [/Do you supply only profile or complete mirror/gi, 'Do you supply frame only or complete LED mirror'],
    [/Round slim profile/gi, 'Round slim LED mirror'],
    [/Standard Profile Design/gi, 'Standard Touch Design'],
    [/Standard profile design/gi, 'standard touch design'],
    [/Imported Profile,/gi, 'Imported frame,'],
    [/Imported profile,/gi, 'Imported frame,'],
    [/LED Mirror Profile Hyderabad/g, 'LED Mirror Hyderabad'],
    [/LED mirror profile Hyderabad/g, 'LED mirror Hyderabad'],
  ];

  for (const [re, rep] of reps) out = out.replace(re, rep);

  out = out.replace(/LED LED mirror/gi, 'LED mirror');
  out = out.replace(/LED aluminium LED mirror/gi, 'LED bathroom mirror with lights');
  out = out.replace(/touch LED LED mirror/gi, 'touch LED bathroom mirror');
  out = out.replace(/Custom height LED LED mirror/gi, 'Custom height LED mirror');
  out = out.replace(/starting price for LED mirror per foot/gi, 'starting LED mirror price per piece');
  out = out.replace(/Is the LED mirror waterproof\?/gi, 'Is the LED bathroom mirror waterproof?');
  out = out.replace(/BeveLED mirror/gi, 'Beveled LED mirror');

  return restorePaths(out, tokens);
}

function cleanupArtifacts(html) {
  const fixes = [
    [/LED LED mirror/gi, 'LED mirror'],
    [/LED aluminium LED mirror/gi, 'LED bathroom mirror with lights'],
    [/touch LED LED mirror/gi, 'touch LED bathroom mirror'],
    [/starting price for LED mirror per foot/gi, 'starting LED mirror price per piece'],
    [/Is the LED mirror waterproof\?/gi, 'Is the LED bathroom mirror waterproof?'],
    [
      /WoodenMax manufactures aluminium LED mirrors with optional LED, touch and motion sensors\./,
      'WoodenMax manufactures bathroom mirrors with lights — backlit, touch and motion sensor options.',
    ],
    [/BeveLED mirror/gi, 'Beveled LED mirror'],
  ];
  for (const [re, rep] of fixes) html = html.replace(re, rep);
  return html;
}

function updateProductSchema(html, cfg) {
  return html.replace(
    /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"Product"[\s\S]*?<\/script>/,
    (block) => {
      let json = block.replace(/^<script type="application\/ld\+json">/, '').replace(/<\/script>$/, '');
      try {
        const data = JSON.parse(json);
        if (data['@type'] !== 'Product') return block;
        data.name = cfg.productName;
        data.description = cfg.meta;
        data.offers = {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: 3500,
          highPrice: 18000,
          offerCount: 5,
          availability: 'https://schema.org/InStock',
          url: data.offers?.url || data.url,
        };
        data.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: 4.8,
          reviewCount: 127,
        };
        return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
      } catch (e) {
        let updated = block;
        updated = updated.replace(/"name":"[^"]*"/, `"name":"${cfg.productName.replace(/"/g, '\\"')}"`);
        updated = updated.replace(/"description":"[^"]*"/, `"description":"${cfg.meta.replace(/"/g, '\\"')}"`);
        updated = updated.replace(/"lowPrice":\d+/g, '"lowPrice":3500');
        updated = updated.replace(/"highPrice":\d+/g, '"highPrice":18000');
        updated = updated.replace(/,"priceSpecification":\{[^}]+\}/g, '');
        if (!updated.includes('aggregateRating')) {
          updated = updated.replace(
            /"offers":\{([^}]+)\}/,
            `"offers":{$1},"${AGG_RATING.slice(1)}`
          );
        }
        return updated;
      }
    }
  );
}

function insertPerPieceTable(html) {
  if (html.includes('wm-per-piece-prices')) return html;
  const idx = html.search(/<section class="catalog-calc-section/);
  if (idx === -1) return html;
  return html.slice(0, idx) + PER_PIECE_TABLE + '\n' + html.slice(idx);
}

function processFile(file, cfg) {
  const abs = path.join(DIR, file);
  let html = fs.readFileSync(abs, 'utf8');
  html = setTitleMeta(html, cfg);
  html = setWebPageSchema(html, cfg);
  html = setH1(html, cfg.h1);
  html = updateProductSchema(html, cfg);
  html = insertPerPieceTable(html);
  html = consumerizeBody(html);
  html = cleanupArtifacts(html);
  fs.writeFileSync(abs, html, 'utf8');
  console.log('  ✓', file);
}

console.log('Updating mirror-profiles keyword targeting…');
for (const [file, cfg] of Object.entries(PAGES)) {
  processFile(file, cfg);
}
console.log('Done.', Object.keys(PAGES).length, 'pages');
