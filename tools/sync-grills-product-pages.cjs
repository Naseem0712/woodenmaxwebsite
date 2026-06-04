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

const RESULTS_MINI = `          <div class="grills-calc-results-mini">
            <div class="grills-calc-stat"><span class="grills-calc-stat-label">Area</span><span id="grill-result-area" class="grills-calc-stat-value">0 sq.ft</span></div>
            <div class="grills-calc-stat"><span class="grills-calc-stat-label">Pipes</span><span id="grill-result-pipes" class="grills-calc-stat-value">0</span></div>
            <div class="grills-calc-stat"><span class="grills-calc-stat-label">Alu Weight</span><span id="grill-result-alu-weight" class="grills-calc-stat-value">0 kg</span></div>
            <div class="grills-calc-stat"><span class="grills-calc-stat-label">Iron Weight</span><span id="grill-result-iron-weight" class="grills-calc-stat-value">0 kg</span></div>
            <div class="grills-calc-stat"><span class="grills-calc-stat-label">Outer Pipes</span><span id="grill-result-outer-qty" class="grills-calc-stat-value">0</span></div>
            <div class="grills-calc-stat"><span class="grills-calc-stat-label">Inner Pipes</span><span id="grill-result-inner-qty" class="grills-calc-stat-value">0</span></div>
            <div class="grills-calc-stat"><span class="grills-calc-stat-label">Rods</span><span id="grill-result-rod-qty" class="grills-calc-stat-value">None</span></div>
            <div class="grills-calc-stat"><span class="grills-calc-stat-label">Nuts</span><span id="grill-result-nuts" class="grills-calc-stat-value">None</span></div>
          </div>`;

const CTA_BLOCK = `        <div style="text-align: center; margin-top: 1.5rem;">
          <a href="../../contact" style="display: inline-block; background: linear-gradient(135deg, #059669, #047857); color: #fff; padding: 1rem 2.5rem; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 1rem;">Get Free Quote</a>
        </div>`;

function isCalcLayoutComplete(calc) {
  if (!calc) return false;
  if (!calc.includes('grills-calc-results-mini') || !calc.includes('grills-calc-tail')) return false;
  if (!calc.includes('grills-gap-fields')) return false;
  if (calc.includes('<label> class="grills-calc-label">')) return false;
  return (
    /grills-calc-group--dims[\s\S]{0,1200}id="grill-unit"/.test(calc) &&
    /grills-calc-group--2[\s\S]{0,1200}id="grill-outer-profile"/.test(calc) &&
    /grills-calc-group--3[\s\S]{0,1200}id="grill-inner-shape"/.test(calc) &&
    /grills-calc-group--pattern[\s\S]{0,1200}id="grill-pattern"/.test(calc)
  );
}

function upgradeCalculatorLayout(calc) {
  if (!calc) return calc;

  if (isCalcLayoutComplete(calc)) return calc;

  calc = calc.replace(/width="28" height="28"/g, 'width="24" height="24"');
  calc = calc.replace(/class="calc-group"/g, 'class="calc-group grills-calc-group"');
  calc = calc.replace(
    /style="display: grid; grid-template-columns: 1fr 1fr 1fr;[^"]*"/g,
    'class="grills-calc-dims"'
  );
  calc = calc.replace(
    /style="display: grid; grid-template-columns: 1fr 1fr; gap: 0\.5rem;"/g,
    'class="grills-calc-dims"'
  );
  calc = calc.replace(
    /<label style="font-size: 0\.8rem; color: #94a3b8;">/g,
    '<label class="grills-field-label">'
  );
  calc = calc.replace(/\sstyle="margin-top: 0\.5rem;"/g, '');

  calc = calc.replace(
    /class="calc-group grills-calc-group grills-calc-group--pattern grills-calc-group--3 grills-calc-group--2 grills-calc-group--dims"/g,
    'class="calc-group grills-calc-group grills-calc-group--dims"'
  );

  calc = calc.replace(
    /(<div class="calc-group grills-calc-group">)(\s*<label class="grills-calc-label">Unit &amp; Dimensions<\/label>)/,
    '<div class="calc-group grills-calc-group grills-calc-group--dims">$2'
  );
  calc = calc.replace(
    /(<div class="calc-group grills-calc-group">)(\s*)<label>Outer Frame Profile<\/label>/,
    '<div class="calc-group grills-calc-group grills-calc-group--2">$2<label class="grills-calc-label">Outer Frame Profile</label>'
  );
  calc = calc.replace(
    /(<div class="calc-group grills-calc-group">)(\s*)<label>Inner Pipe Shape/,
    '<div class="calc-group grills-calc-group grills-calc-group--3">$2<label class="grills-calc-label">Inner Pipe Shape'
  );
  calc = calc.replace(
    /(<div class="calc-group grills-calc-group">)(\s*)<label>Pattern &amp; Gap<\/label>/,
    '<div class="calc-group grills-calc-group grills-calc-group--pattern">$2<label class="grills-calc-label">Pattern &amp; Gap</label>'
  );
  calc = calc.replace(
    /<label> class="grills-calc-label">/g,
    '<label class="grills-calc-label">'
  );
  calc = calc.replace(
    /(<div class="calc-group grills-calc-group">)(\s*)<label>Unit &amp; Dimensions<\/label>/,
    '<div class="calc-group grills-calc-group grills-calc-group--dims">$2<label class="grills-calc-label">Unit &amp; Dimensions</label>'
  );

  if (!calc.includes('grills-gap-fields')) {
    const gap1 = calc.match(/id="grill-gap1"[^>]*value="([^"]*)"/)?.[1] || '2';
    const gap2 = calc.match(/id="grill-gap2"[^>]*value="([^"]*)"/)?.[1] || '3';
    const gap3 = calc.match(/id="grill-gap3"[^>]*value="([^"]*)"/)?.[1] || '4';
    const gapFields = `          <div class="grills-gap-fields">
            <div class="grills-gap-cell">
              <label class="grills-field-label">Gap 1</label>
              <input type="number" id="grill-gap1" class="calc-input" value="${gap1}" step="0.1" min="0.1">
            </div>
            <div class="grills-gap-cell" id="grill-gap2-row" style="display: none;">
              <label class="grills-field-label">Gap 2</label>
              <input type="number" id="grill-gap2" class="calc-input" value="${gap2}" step="0.1" min="0.1">
            </div>
            <div class="grills-gap-cell" id="grill-gap3-row" style="display: none;">
              <label class="grills-field-label">Gap 3</label>
              <input type="number" id="grill-gap3" class="calc-input" value="${gap3}" step="0.1" min="0.1">
            </div>
          </div>`;

    calc = calc.replace(
      /<div(?: style="margin-top: 0\.5rem;")?><label class="grills-field-label">Gap 1<\/label>[\s\S]*?<div id="grill-gap3-row"[^>]*>[\s\S]*?<\/div>\s*/,
      `${gapFields}\n`
    );
  }

  calc = calc.replace(
    /(<div class="grills-gap-fields">[\s\S]*?<\/div>)\s*\n?<\/div>\s*\n(\s*<div class="grills-calc-tail">)/,
    '$1\n        </div>\n\n        $2'
  );

  if (!calc.includes('grills-calc-tail')) {
    const coatingInner = calc.match(/<select id="grill-coating-finish" class="calc-select">([\s\S]*?)<\/select>/)?.[1];
    const dividerCount = calc.match(/id="grill-divider-count"[^>]*value="([^"]*)"/)?.[1] || '1';
    const rodInner = calc.match(/<select id="grill-rod-size" class="calc-select">([\s\S]*?)<\/select>/)?.[1];
    const dividersInner = calc.match(/<select id="grill-dividers" class="calc-select">([\s\S]*?)<\/select>/)?.[1];

    calc = calc.replace(
      /(<div class="calc-group grills-calc-group">\s*<label(?: class="grills-calc-label")?>Threaded Rod(?: \(Iron\))?<\/label>[\s\S]*?<\/div>\s*)(<div class="calc-group grills-calc-group">\s*<label(?: class="grills-calc-label")?>(?:Horizontal )?Dividers<\/label>[\s\S]*?<\/div>\s*)(<div class="calc-group grills-calc-group">\s*<label(?: class="grills-calc-label")?>Coating Finish<\/label>[\s\S]*?<\/div>\s*)(?=<div class="calc-price-display)/,
      `<div class="grills-calc-tail">
        <div class="calc-group grills-calc-group grills-calc-mini">
          <label class="grills-calc-label">Threaded Rod (Iron)</label>
          <select id="grill-rod-size" class="calc-select">${rodInner || '<option value="0">None</option><option value="8">8mm Rod</option><option value="10">10mm Rod</option>'}</select>
        </div>

        <div class="calc-group grills-calc-group grills-calc-mini">
          <label class="grills-calc-label">Horizontal Dividers</label>
          <select id="grill-dividers" class="calc-select">${dividersInner || '<option value="no">No Dividers</option><option value="yes">Add Dividers</option>'}</select>
          <div id="grill-divider-options" style="display: none;">
            <div class="grills-calc-dims">
              <div>
                <label class="grills-field-label">Count</label>
                <input type="number" id="grill-divider-count" class="calc-input" value="${dividerCount}" min="1" max="5">
              </div>
              <div>
                <label class="grills-field-label">Layout</label>
                <select id="grill-divider-layout" class="calc-select">
                  <option value="equal">Equal Spacing</option>
                  <option value="center">Center Grouped</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="calc-group grills-calc-group grills-calc-mini">
          <label class="grills-calc-label">Coating Finish</label>
          <select id="grill-coating-finish" class="calc-select">${coatingInner || '<option value="plain">Plain Powder Coat</option><option value="texture">Texture Finish (+₹15/sqft)</option><option value="wooden">Wooden Grain (+₹35/sqft)</option>'}</select>
        </div>
        </div>

        `
    );
  }

  calc = calc.replace(
    /class="calc-price-display"/g,
    'class="calc-price-display grills-calc-price-panel"'
  );

  if (!calc.includes('grills-calc-results-mini')) {
    calc = calc.replace(
      /<div class="calc-price-display grills-calc-price-panel">\s*<div style="display: grid;[\s\S]*?<\/div>\s*<div style="border-top:[\s\S]*?<\/div>\s*<\/div>/,
      `<div class="calc-price-display grills-calc-price-panel">
${RESULTS_MINI}
          
          <div class="grills-calc-price-rows">
            <div class="calc-price-row">
              <span class="calc-price-label">Selling Price:</span>
              <span id="grill-result-total" class="calc-price-value" style="font-size: 1.5rem;">₹0</span>
            </div>
            <div class="calc-price-row">
              <span class="calc-price-label">Rate per sqft:</span>
              <span id="grill-result-per-sqft" class="calc-price-value">₹0/sqft</span>
            </div>
            <div class="calc-price-row">
              <span class="calc-price-label">Per Grill:</span>
              <span id="grill-result-per-unit" class="calc-price-value">₹0/grill</span>
            </div>
            <div class="calc-price-row" style="opacity: 0.7;">
              <span class="calc-price-label">Installation:</span>
              <span id="grill-result-install" class="calc-price-value">₹0</span>
            </div>
            <div class="calc-price-row" style="opacity: 0.7;">
              <span class="calc-price-label">Wastage Cost:</span>
              <span id="grill-result-wastage" class="calc-price-value">₹0</span>
            </div>
            <div class="calc-price-row" style="border-top: 2px solid rgba(212, 175, 55, 0.5); margin-top: 0.75rem; padding-top: 0.75rem;">
              <span class="calc-price-label" style="font-weight: 700;">Grand Total (incl. install + wastage):</span>
              <span id="grill-result-grand" class="calc-price-value grills-grand-total">₹0</span>
            </div>
          </div>
        </div>`
    );
  }

  if (!calc.includes('Get Free Quote')) {
    calc = calc.replace(/(\s*)<\/div>\s*$/, `\n${CTA_BLOCK}$1</div>`);
  }

  return calc;
}

function repairGrillPageHtml(html) {
  html = html.replace(
    /(<div style="text-align: center; margin-top: 1\.5rem;">[\s\S]*?Get Free Quote[\s\S]*?<\/div>\s*<\/div>)\s*<div style="text-align: center; margin-top: 1\.5rem;">[\s\S]*?Get Free Quote[\s\S]*?<\/div>\s*\n\s*<\/div>/g,
    '$1'
  );
  return html;
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

  calc = upgradeCalculatorLayout(calc);

  return `  <section class="grills-calc-section">
    <div class="container grills-calculator-page-wrap">
      ${calc}
    </div>
  </section>

`;
}

function upgradeCalcInPage(html, meta) {
  const oldCalc = extractCalcDiv(html, meta.calcId);
  if (!oldCalc) return html;
  const newCalc = upgradeCalculatorLayout(oldCalc);
  if (newCalc === oldCalc) return html;
  return html.replace(oldCalc, newCalc);
}

function transformPage(meta) {
  const filePath = path.join(GRILLS_DIR, meta.file);
  let html = fs.readFileSync(filePath, 'utf8');
  html = repairGrillPageHtml(html);

  if (html.includes('grills-product-hero') && html.includes('grills-calc-section')) {
    const upgraded = upgradeCalcInPage(html, meta);
    html = repairGrillPageHtml(upgraded !== html ? upgraded : html);
    html = bumpPricesInHtml(html);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(upgraded !== html ? 'Upgraded calculator layout:' : 'Repaired / synced:', meta.file);
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
  let html = repairGrillPageHtml(fs.readFileSync(p, 'utf8'));
  html = bumpPricesInHtml(html);
  fs.writeFileSync(p, html, 'utf8');
  console.log('Synced: aluminium-window-grills.html');
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
