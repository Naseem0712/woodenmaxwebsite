/**
 * Sync all grills product pages to aluminium layout + bump marketing ₹ rates ~10%.
 * Run: node tools/sync-grills-product-pages.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GRILLS_DIR = path.join(ROOT, 'products', 'grills');

const PAGES = [
  {
    file: 'balcony-safety-grills.html',
    calcId: 'grill-calc-balcony-safety',
    productName: 'Balcony Safety Grills',
    breadcrumb: 'Balcony Safety Grills',
    img: '../../images/products/Grills/aluminium-child-safety-balcony-grill.webp',
    imgAlt: 'Aluminium Child Safety Balcony Grill Price',
  },
  {
    file: 'iron-safety-grills.html',
    calcId: 'grill-calc-iron-safety',
    productName: 'Iron Safety Grills',
    breadcrumb: 'Iron Safety Grills',
    img: '../../images/products/Grills/aluminium grill fabricators near me.webp',
    imgAlt: 'Iron Safety Grill Fabricators Price',
  },
  {
    file: 'window-safety-grills.html',
    calcId: 'grill-calc-window-safety',
    productName: 'Window Safety Grills',
    breadcrumb: 'Window Safety Grills',
    img: '../../images/products/Grills/window grill design.webp',
    imgAlt: 'Window Safety Grill Design',
  },
  {
    file: 'staircase-balustrade-grills.html',
    calcId: 'grill-calc-staircase',
    productName: 'Staircase Balustrade Grills',
    breadcrumb: 'Staircase Balustrade Grills',
    img: '../../images/products/Grills/staircase-balustrade-grill-design.webp',
    imgAlt: 'Staircase Balustrade Grill Design',
  },
];

function bumpInr(n) {
  return Math.max(5, Math.round((Number(n) * 1.1) / 5) * 5);
}

function bumpPricesInHtml(html) {
  return html
    .replace(/₹(\d{2,4})\s*[–-]\s*₹(\d{2,4})/g, (_, a, b) => `₹${bumpInr(a)}–${bumpInr(b)}`)
    .replace(/₹(\d{2,4})\/sqft/g, (_, n) => `₹${bumpInr(n)}/sqft`)
    .replace(/"lowPrice":\s*"(\d+)"/g, (_, n) => `"lowPrice": "${bumpInr(n)}"`)
    .replace(/"highPrice":\s*"(\d+)"/g, (_, n) => `"highPrice": "${bumpInr(n)}"`);
}

function extractBetween(html, startRe, endRe) {
  const start = html.search(startRe);
  if (start < 0) return '';
  const rest = html.slice(start);
  const end = rest.search(endRe);
  if (end < 0) return rest;
  return rest.slice(0, end);
}

function extractIntro(html) {
  const heroChunk = extractBetween(html, /<section class="product-detail-hero"/, /<\/section>\s*\n\s*<section/);
  const p = heroChunk.match(/<p[^>]*>([\s\S]*?)<\/p>/);
  if (!p) return '';
  return p[1].replace(/<[^>]+>/g, '').trim();
}

function extractH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractDetailsBlock(html) {
  const hero = extractBetween(html, /<section class="product-detail-hero"/, /<\/section>\s*\n\s*<section/);
  const parts = [];
  const snippet = hero.match(
    /<div style="background: linear-gradient\(135deg, #ecfdf5[\s\S]*?<\/table>\s*<\/div>/
  );
  if (snippet) {
    parts.push(
      snippet[0].replace(
        /^<div style="/,
        '<div class="grills-price-snippet" style="'
      )
    );
  }
  const twoCol = hero.match(/<div class="grills-hero-two-col">[\s\S]*/);
  if (twoCol) parts.push(twoCol[0]);
  return parts.join('\n      ').trim();
}

function extractCalcDiv(html, calcId) {
  const start = html.indexOf(`<div id="${calcId}"`);
  if (start < 0) return '';
  const tagRe = /<(\/?)div\b[^>]*>/gi;
  tagRe.lastIndex = start;
  let depth = 0;
  let m;
  while ((m = tagRe.exec(html))) {
    if (m[1]) depth--;
    else depth++;
    if (depth === 0 && m.index > start) {
      return html.slice(start, tagRe.lastIndex);
    }
  }
  return '';
}

function buildHero(meta, h1, intro) {
  const introHtml = intro.includes('<strong>')
    ? intro
    : intro.replace(/(₹[\d–-]+(?:\/sqft)?)/g, '<strong>$1</strong>');
  return `  <section class="product-detail-hero grills-product-hero">
    <div class="container grills-hero-compact">
      <nav class="grills-breadcrumb" aria-label="Breadcrumb" style="margin-bottom: 0.75rem; font-size: 0.85rem;">
        <a href="../../index">Home</a>
        <span style="color: rgba(255,255,255,0.4); margin: 0 0.5rem;">›</span>
        <a href="../grills">Grills</a>
        <span style="color: rgba(255,255,255,0.4); margin: 0 0.5rem;">›</span>
        <span aria-current="page">${meta.breadcrumb}</span>
      </nav>
      <header class="grills-hero-head">
        <h1>${h1}</h1>
        <p class="grills-hero-intro">${introHtml}</p>
      </header>
      <div class="grills-visual-stage" id="grills-visual-stage">
        <div class="grills-hero-photo" id="grills-hero-photo">
          <img loading="eager" decoding="async" src="${meta.img}" alt="${meta.imgAlt}" width="800" height="400">
        </div>
        <div class="grills-hero-preview-slot" id="grills-hero-preview-slot" aria-hidden="true"></div>
      </div>
    </div>
  </section>

`;
}

function normalizeCalcBlock(html, meta) {
  let calc = extractCalcDiv(html, meta.calcId);
  if (!calc) return '';

  calc = calc.replace(/<div style="text-align: center; padding: 1rem;[\s\S]*?<\/div>\s*/i, '');
  calc = calc.replace(
    /<div style="text-align: center; margin-top: 1\.5rem;">[\s\S]*?Get Free Quote[\s\S]*?<\/div>\s*/i,
    ''
  );
  calc = calc.replace(
    new RegExp(`<div id="${meta.calcId}" data-grill-calculator class="price-calculator-container">`),
    `<div id="${meta.calcId}" data-grill-calculator data-product-name="${meta.productName}" class="price-calculator-container">`
  );

  calc = calc.replace(/class="calc-group"/g, 'class="calc-group grills-calc-group"');
  calc = calc.replace(
    /(<div class="calc-group grills-calc-group">\s*)<label>Unit/,
    '$1<label class="grills-calc-label">Unit'
  );
  calc = calc.replace(
    /style="display: grid; grid-template-columns: 1fr 1fr 1fr;[^"]*"/g,
    'class="grills-calc-dims"'
  );
  calc = calc.replace(
    /<label style="font-size: 0\.8rem; color: #94a3b8;">/g,
    '<label class="grills-field-label">'
  );
  calc = calc.replace(
    /class="calc-price-display"/g,
    'class="calc-price-display grills-calc-price-panel"'
  );

  return `  <section class="grills-calc-section">
    <div class="container grills-calculator-page-wrap">
      ${calc}
    </div>
  </section>

`;
}

function transformPage(meta) {
  const filePath = path.join(GRILLS_DIR, meta.file);
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('grills-product-hero') && html.includes('grills-calc-section')) {
    console.log('Skip (already synced):', meta.file);
    html = bumpPricesInHtml(html);
    fs.writeFileSync(filePath, html, 'utf8');
    return;
  }

  const h1 = extractH1(html);
  const intro = extractIntro(html);
  const details = extractDetailsBlock(html);
  const calcSection = normalizeCalcBlock(html, meta);

  const navEnd = html.indexOf('</nav>');
  const faqStart = html.search(/<!-- FAQ -->|<section style="padding: 3rem 0; background: #F8FAFC;">/);
  const tail = html.slice(faqStart);

  let head = html.slice(0, navEnd + 7);
  head = bumpPricesInHtml(head);

  if (!head.includes('grills-product-page.css')) {
    head = head.replace(
      /(<link rel="stylesheet" href="\.\.\/\.\.\/css\/calculator-mobile-ux\.css[^>]*>)/,
      '$1\n  <link rel="stylesheet" href="../../css/grills-product-page.css">'
    );
  }
  head = head.replace(/<body>/, '<body class="grills-product-page">');

  const hero = buildHero(meta, h1, intro);
  const detailsSection = details
    ? `  <section class="grills-product-details">\n    <div class="container">\n${details}\n    </div>\n  </section>\n\n`
    : '';

  const out = head + '\n' + hero + calcSection + detailsSection + bumpPricesInHtml(tail);
  fs.writeFileSync(filePath, out, 'utf8');
  console.log('Synced:', meta.file);
}

function bumpAluminium() {
  const p = path.join(GRILLS_DIR, 'aluminium-window-grills.html');
  let html = fs.readFileSync(p, 'utf8');
  html = bumpPricesInHtml(html);
  fs.writeFileSync(p, html, 'utf8');
  console.log('Bumped prices: aluminium-window-grills.html');
}

function bumpHub() {
  const p = path.join(ROOT, 'products', 'grills.html');
  let html = fs.readFileSync(p, 'utf8');
  html = bumpPricesInHtml(html);
  fs.writeFileSync(p, html, 'utf8');
  console.log('Bumped prices: grills.html');
}

function addHubCalculatorList() {
  const p = path.join(ROOT, 'products', 'grills.html');
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes('grills-calc-hub-list')) {
    console.log('Hub calculator list already present');
    return;
  }
  const block = `
  <!-- Live calculator hub list -->
  <section class="grills-calc-hub" id="grills-calculators" style="padding: 3rem 0; background: #F8FAFC; border-top: 1px solid #E2E8F0;">
    <div class="container" style="max-width: 1100px;">
      <h2 style="font-size: 1.75rem; font-weight: 700; color: #0F172A; margin: 0 0 0.5rem; text-align: center;">Live Grill Price Calculators</h2>
      <p style="text-align: center; color: #475569; margin: 0 0 1.75rem; max-width: 40rem; margin-left: auto; margin-right: auto; line-height: 1.55;">Open any calculator — enter size, profile &amp; finish for instant ₹/sqft, live preview, PDF quote &amp; cart checkout.</p>
      <div class="grills-calc-hub-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;">
        <a href="./grills/aluminium-window-grills#grill-calc-aluminium-window" class="grills-calc-hub-card" style="display:block;padding:1.1rem 1.15rem;background:#fff;border:1px solid #E2E8F0;border-radius:12px;text-decoration:none;transition:border-color .2s,box-shadow .2s;">
          <strong style="display:block;color:#0F172A;font-size:1rem;margin-bottom:.35rem;">Aluminium Window Grills</strong>
          <span style="color:#059669;font-weight:600;font-size:.9rem;">₹385–495/sqft</span>
          <span style="display:block;color:#64748B;font-size:.82rem;margin-top:.4rem;line-height:1.4;">Rust-proof · live preview · add to cart</span>
        </a>
        <a href="./grills/balcony-safety-grills#grill-calc-balcony-safety" class="grills-calc-hub-card" style="display:block;padding:1.1rem 1.15rem;background:#fff;border:1px solid #E2E8F0;border-radius:12px;text-decoration:none;">
          <strong style="display:block;color:#0F172A;font-size:1rem;margin-bottom:.35rem;">Balcony Safety Grills</strong>
          <span style="color:#059669;font-weight:600;font-size:.9rem;">₹440–605/sqft</span>
          <span style="display:block;color:#64748B;font-size:.82rem;margin-top:.4rem;">Child-safe · high-rise balconies</span>
        </a>
        <a href="./grills/window-safety-grills#grill-calc-window-safety" class="grills-calc-hub-card" style="display:block;padding:1.1rem 1.15rem;background:#fff;border:1px solid #E2E8F0;border-radius:12px;text-decoration:none;">
          <strong style="display:block;color:#0F172A;font-size:1rem;margin-bottom:.35rem;">Window Safety Grills</strong>
          <span style="color:#059669;font-weight:600;font-size:.9rem;">₹330–440/sqft</span>
          <span style="display:block;color:#64748B;font-size:.82rem;margin-top:.4rem;">Ground floor · thick profiles</span>
        </a>
        <a href="./grills/iron-safety-grills#grill-calc-iron-safety" class="grills-calc-hub-card" style="display:block;padding:1.1rem 1.15rem;background:#fff;border:1px solid #E2E8F0;border-radius:12px;text-decoration:none;">
          <strong style="display:block;color:#0F172A;font-size:1rem;margin-bottom:.35rem;">Iron Safety Grills</strong>
          <span style="color:#059669;font-weight:600;font-size:.9rem;">₹220–330/sqft</span>
          <span style="display:block;color:#64748B;font-size:.82rem;margin-top:.4rem;">Budget MS grill · ornamental</span>
        </a>
        <a href="./grills/staircase-balustrade-grills#grill-calc-staircase" class="grills-calc-hub-card" style="display:block;padding:1.1rem 1.15rem;background:#fff;border:1px solid #E2E8F0;border-radius:12px;text-decoration:none;">
          <strong style="display:block;color:#0F172A;font-size:1rem;margin-bottom:.35rem;">Staircase Balustrade</strong>
          <span style="color:#059669;font-weight:600;font-size:.9rem;">₹495–660/sqft</span>
          <span style="display:block;color:#64748B;font-size:.82rem;margin-top:.4rem;">Stair &amp; railing balustrade</span>
        </a>
      </div>
    </div>
  </section>
`;
  html = html.replace(
    /(\s*<!-- products-grid-lifted-by-reorder-hubs -->)/,
    block + '\n$1'
  );
  html = bumpPricesInHtml(html);
  fs.writeFileSync(p, html, 'utf8');
  console.log('Added hub calculator list');
}

PAGES.forEach(transformPage);
bumpAluminium();
bumpHub();
