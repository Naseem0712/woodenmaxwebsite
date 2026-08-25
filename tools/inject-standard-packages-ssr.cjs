/**
 * Build-time sync: crawlable package cards + initial ₹ + JSON-LD into product HTML.
 *
 * Reads: data/rates.json, data/products.json, data/mirror.json
 * Formulas: js/standard-size-packages.js (same as runtime)
 * Runtime JS only refreshes [data-price]/[data-package-price] — never builds cards.
 *
 * Preferred:  npm run rates:sync
 *             npm run rates:sync -- --dry
 *             npm run rates:verify
 *
 * Direct:     node tools/inject-standard-packages-ssr.cjs
 *             node tools/sync-package-rates-html.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const VERIFY_ONLY = process.argv.includes('--verify');
const CSS_HREF = '/css/standard-size-packages.css?v=20260801a';
const SECTION_MARK = 'wm-standard-packages';

const productsData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
const mirrorData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'mirror.json'), 'utf8'));
const siteRates = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'rates.json'), 'utf8'));
const globalRates = productsData.globalRates || {};
const productsById = Object.create(null);
(productsData.products || []).forEach((p) => {
  if (p && p.id) productsById[p.id] = p;
});

function mergeProduct(p) {
  if (!p) return null;
  const rates = JSON.parse(JSON.stringify(p.rates || {}));
  if (rates.useGlobalRates && globalRates) {
    if (globalRates.glass) {
      rates.glass = Object.assign({}, globalRates.glass, rates.glass || {});
      Object.keys((p.rates && p.rates.glass) || {}).forEach((k) => {
        if (p.rates.glass[k] === 0 && globalRates.glass[k] != null) rates.glass[k] = globalRates.glass[k];
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
  location: { href: 'https://woodenmax.in/', pathname: '/' },
  setTimeout,
  clearTimeout,
  fetch: undefined
};
ctx.window = ctx;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'pricing', 'pricing-models.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'standard-size-packages.js'), 'utf8'), ctx);
const api = ctx.WMStandardPackages;
if (!api || typeof api.buildSectionHtml !== 'function') {
  console.error('WMStandardPackages.buildSectionHtml missing — update standard-size-packages.js first');
  process.exit(1);
}
if (typeof api.setRates === 'function') api.setRates(siteRates);

function walkHtml(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkHtml(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Scan to end of a start tag, respecting quotes (attrs may contain '>'). */
function scanOpenTagEnd(html, ltIndex) {
  if (html[ltIndex] !== '<') return -1;
  let i = ltIndex + 1;
  let quote = null;
  while (i < html.length) {
    const ch = html[i];
    if (quote) {
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      i += 1;
      continue;
    }
    if (ch === '>') return i + 1;
    i += 1;
  }
  return -1;
}

function readOpenTag(html, ltIndex) {
  const end = scanOpenTagEnd(html, ltIndex);
  if (end < 0) return null;
  const open = html.slice(ltIndex, end);
  const m = open.match(/^<([a-zA-Z0-9:-]+)\b/i);
  if (!m) return null;
  return { open, tag: m[1], end, selfClosing: /\/\s*>$/.test(open) };
}

/** Find end index (exclusive) of an element starting at openTagIndex. */
function findElementEnd(html, openTagIndex) {
  const ot = readOpenTag(html, openTagIndex);
  if (!ot) return -1;
  if (ot.selfClosing) return ot.end;
  const tag = ot.tag.toLowerCase();
  let i = ot.end;
  let depth = 1;
  while (i < html.length && depth > 0) {
    const lt = html.indexOf('<', i);
    if (lt < 0) return -1;
    if (html.startsWith('</', lt)) {
      const closeEnd = html.indexOf('>', lt);
      if (closeEnd < 0) return -1;
      const closeTag = html.slice(lt + 2, closeEnd).trim().toLowerCase().split(/\s/)[0];
      if (closeTag === tag) {
        depth -= 1;
        if (depth === 0) return closeEnd + 1;
      }
      i = closeEnd + 1;
      continue;
    }
    if (html.startsWith('<!--', lt)) {
      const cend = html.indexOf('-->', lt + 4);
      i = cend < 0 ? html.length : cend + 3;
      continue;
    }
    const nested = readOpenTag(html, lt);
    if (!nested) {
      i = lt + 1;
      continue;
    }
    if (nested.tag.toLowerCase() === tag && !nested.selfClosing) depth += 1;
    i = nested.end;
  }
  return -1;
}

function findAttr(html, attr, start, end) {
  const slice = html.slice(start, Math.min(end, start + 12000));
  const re = new RegExp(attr + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i');
  const m = slice.match(re);
  if (!m) return '';
  return (m[2] != null ? m[2] : m[3] || '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function findOpenById(html, id) {
  const needle = new RegExp('\\bid\\s*=\\s*["\']' + escapeRe(id) + '["\']', 'i');
  let from = 0;
  while (from < html.length) {
    const lt = html.indexOf('<', from);
    if (lt < 0) return null;
    const ot = readOpenTag(html, lt);
    if (!ot) {
      from = lt + 1;
      continue;
    }
    if (needle.test(ot.open)) {
      return { index: lt, tag: ot.tag, open: ot.open };
    }
    from = ot.end;
  }
  return null;
}

function findOpenByClassProduct(html) {
  let from = 0;
  while (from < html.length) {
    const lt = html.indexOf('<', from);
    if (lt < 0) return null;
    const ot = readOpenTag(html, lt);
    if (!ot) {
      from = lt + 1;
      continue;
    }
    if (/^(div|section)$/i.test(ot.tag) && /\bprice-calculator-container\b/i.test(ot.open)) {
      return { index: lt, tag: ot.tag, open: ot.open };
    }
    from = ot.end;
  }
  return null;
}

function pageUrlFromHtml(html, abs) {
  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (canonical && /^https:\/\/woodenmax\.in\//i.test(canonical[1])) return canonical[1];
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/').replace(/\.html$/i, '');
  return 'https://woodenmax.in/' + rel;
}

function stripExistingSections(html) {
  let out = html;
  const ids = [SECTION_MARK, 'wm-standard-packages-mirror', 'wm-standard-packages-pergola'];
  for (const id of ids) {
    const open = findOpenById(out, id);
    if (!open) continue;
    const end = findElementEnd(out, open.index);
    if (end > open.index) {
      out = out.slice(0, open.index) + out.slice(end);
    }
  }
  // Remove prior SSR JSON-LD
  out = out.replace(/<script\b[^>]*\bid=["']wm-std-pkg-jsonld["'][^>]*>[\s\S]*?<\/script>\s*/i, '');
  return out;
}

function ensureCssLink(html) {
  if (/standard-size-packages\.css/i.test(html)) {
    return html.replace(
      /href=["'][^"']*standard-size-packages\.css[^"']*["']/i,
      'href="' + CSS_HREF + '"'
    );
  }
  const link = '  <link rel="stylesheet" href="' + CSS_HREF + '" id="wm-std-pkg-css">\n';
  if (/calculator-mobile-ux\.css/i.test(html)) {
    return html.replace(
      /(<link\s+[^>]*calculator-mobile-ux\.css[^>]*>)/i,
      '$1\n' + link.trim()
    );
  }
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, link + '</head>');
  }
  return html;
}

function resolveCalcJob(html, absFile) {
  // Mirror catalog pages
  const mir = findOpenById(html, 'wmCatalogCalc');
  if (mir && /mirror/i.test(absFile)) {
    const end = findElementEnd(html, mir.index);
    if (end < 0) return null;
    const openEnd = mir.index + mir.open.length;
    const modeAttr = findAttr(html, 'data-calc-mode', mir.index, openEnd);
    const cfgRaw = findAttr(html, 'data-calc-config', mir.index, openEnd);
    if (!modeAttr && !cfgRaw) return null;
    const mode = modeAttr || 'bevel-modular';
    let cfg = {};
    try { cfg = cfgRaw ? JSON.parse(cfgRaw) : {}; } catch (e) { cfg = {}; }
    if (!(cfg.presetSizes || cfg.bevel != null || cfg.v120 != null)) {
      cfg = (mirrorData.calculators && mirrorData.calculators['bevel-modular']) || cfg;
    }
    const slug = findAttr(html, 'data-page-slug', mir.index, openEnd) || 'mirror';
    const pageTitle = findAttr(html, 'data-page-title', mir.index, openEnd) || 'LED Mirror';
    const packages = api.buildMirrorCatalogPackages(mode, cfg);
    if (!packages.length) return null;
    return {
      kind: 'mirror',
      insertAt: end,
      sectionId: 'wm-standard-packages-mirror',
      product: { id: 'mirror-' + slug, name: pageTitle, category: 'mirror-profiles' },
      packages,
      heading: 'Standard mirror packages',
      sub: 'Preset sizes from this page\'s live calculator · Rates update when supplier prices change.'
    };
  }

  // Pergola pricing root
  const perg = findOpenById(html, 'product-pricing-root');
  if (perg && /[\\/]pergola[\\/]/i.test(absFile)) {
    const end = findElementEnd(html, perg.index);
    if (end < 0) return null;
    const openEnd = perg.index + perg.open.length;
    const lineId = findAttr(html, 'data-pergola-line', perg.index, openEnd) || 'fixed_aluminium_glass';
    const packages = api.buildPergolaGlassPackages(siteRates, lineId);
    if (!packages.length) return null;
    return {
      kind: 'pergola',
      insertAt: end,
      sectionId: 'wm-standard-packages-pergola',
      product: { id: 'pergola-' + lineId, name: 'Aluminium Pergola', category: 'pergola' },
      packages,
      heading: 'Standard pergola packages',
      sub: '6×25 to 35×45 ft footprints · 9 / 9.5 / 10 ft clearance · Glass roof live rates.'
    };
  }

  // Standard calculator containers
  const calc = findOpenByClassProduct(html);
  if (!calc) return null;
  const end = findElementEnd(html, calc.index);
  if (end < 0) return null;
  const openEnd = calc.index + calc.open.length;
  let productId = findAttr(html, 'data-product', calc.index, openEnd);
  if (!productId) {
    const idAttr = findAttr(html, 'id', calc.index, openEnd);
    if (idAttr.indexOf('price-calculator-') === 0) {
      productId = idAttr.slice('price-calculator-'.length);
    }
  }
  // Glass railing path fallback (same as JS mountGlassRailing)
  if (!productId) {
    const base = path.basename(absFile).toLowerCase();
    if (base.indexOf('staircase-glass-railing') !== -1) productId = 'glass-railing-staircase';
    else if (base.indexOf('balcony-glass-railing') !== -1) productId = 'glass-railing-balcony';
  }
  if (!productId) return null;
  const raw = productsById[productId];
  if (!raw || raw.status === 'inactive') return null;
  const product = mergeProduct(raw);
  const packages = api.buildPackages(product);
  if (!packages.length) return null;
  const heading = api.headingFor(product);
  let sub = 'Live calculator rates · Update when supplier rates change.';
  // Match premium sliding subcopy from mountOne
  if (product.category === 'aluminium-windows' && product.id !== '3track-sliding') {
    const subcat = String(product.subcategory || '').toLowerCase();
    if (subcat === 'sliding' || /sliding/.test(product.id || '')) {
      const gmm = packages[0] && packages[0].glassMm ? packages[0].glassMm : 8;
      sub = 'Live rates · Package includes ' + gmm + 'mm clear toughened · Mesh variants when product supports mesh · Sizes 7×7 to 12×8.';
    }
  }
  return {
    kind: 'calc',
    insertAt: end,
    sectionId: SECTION_MARK,
    product,
    packages,
    heading,
    sub
  };
}

function buildJsonLdScript(job, pageUrl) {
  const schema = api.buildPackageJsonLd(job.product, job.packages, job.sectionId, pageUrl);
  return '<script type="application/ld+json" id="wm-std-pkg-jsonld">' + JSON.stringify(schema) + '</script>\n';
}

function injectJob(html, job, absFile) {
  /* Avoid formatting churn: pages whose existing SSR contract is already
     valid are byte-stable. Only canonical-pricing targets need a release
     revision marker added by this migration. */
  const relForTarget = path.relative(ROOT, absFile).replace(/\\/g, '/');
  const target = relForTarget === 'products/aluminium-windows/3-track-sliding-window.html' ||
    relForTarget === 'products/shower-partitions/frameless-shower-partition.html' ||
    relForTarget === 'products/pergola/aluminium-pergola.html';
  const current = verifyFileContent(html, absFile);
  if (current.ok && (!target || /\bdata-pricing-revision=["'][^"']+["']/.test(html))) {
    return { html, changed: false, cardCount: job.packages.length, sectionId: job.sectionId, productId: job.product.id };
  }
  let out = stripExistingSections(html);
  // Recompute insert point after strip
  const job2 = resolveCalcJob(out, absFile);
  if (!job2) return { html, changed: false, reason: 'no job after strip' };
  const sectionHtml = api.buildSectionHtml(job2.product, job2.packages, {
    sectionId: job2.sectionId,
    heading: job2.heading,
    sub: job2.sub,
    lineId: job2.kind === 'pergola' ? String(job2.product.id).replace(/^pergola-/, '') : undefined,
    pricingRevision: api.getPricingRevision
      ? api.getPricingRevision(job2.product, job2.kind === 'pergola' ? siteRates : null, job2.kind === 'pergola' ? String(job2.product.id).replace(/^pergola-/, '') : undefined)
      : ''
  });
  const insertAt = job2.insertAt;
  out = out.slice(0, insertAt) + '\n' + sectionHtml + '\n' + out.slice(insertAt);
  out = ensureCssLink(out);
  const jsonLd = buildJsonLdScript(job2, pageUrlFromHtml(out, absFile));
  if (/id=["']wm-std-pkg-jsonld["']/i.test(out)) {
    out = out.replace(/<script\b[^>]*\bid=["']wm-std-pkg-jsonld["'][^>]*>[\s\S]*?<\/script>\s*/i, jsonLd);
  } else if (/<\/head>/i.test(out)) {
    out = out.replace(/<\/head>/i, '  ' + jsonLd + '</head>');
  }
  return { html: out, changed: out !== html, cardCount: job2.packages.length, sectionId: job2.sectionId, productId: job2.product.id };
}

function verifyFileContent(html, abs) {
  const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
  const job = resolveCalcJob(stripExistingSections(html), abs) || resolveCalcJob(html, abs);
  if (!job) return { rel, skip: true, ok: true };
  const hasSection = new RegExp('id=["\']' + escapeRe(job.sectionId) + '["\']').test(html);
  const cardCount = (html.match(/wm-std-pkg-card/g) || []).length;
  const btnCount = (html.match(/data-action=["']pkg-/g) || []).length;
  const hasCss = /standard-size-packages\.css/i.test(html);
  const hasSsr = /data-ssr=["']1["']/.test(html);
  const ok = hasSection && cardCount >= job.packages.length && btnCount >= job.packages.length * 3 && hasCss && hasSsr;
  return {
    rel,
    skip: false,
    ok,
    expect: job.packages.length,
    cardCount,
    btnCount,
    hasSection,
    hasCss,
    hasSsr,
    productId: job.product.id
  };
}

function verifyFile(abs) {
  return verifyFileContent(fs.readFileSync(abs, 'utf8'), abs);
}

function main() {
  const pages = walkHtml(path.join(ROOT, 'products'));
  const jobs = [];
  for (const abs of pages) {
    const html = fs.readFileSync(abs, 'utf8');
    const job = resolveCalcJob(html, abs);
    if (job) jobs.push({ abs, job, html });
  }

  console.log('Eligible product pages:', jobs.length);

  if (VERIFY_ONLY) {
    let pass = 0;
    let fail = 0;
    const fails = [];
    for (const { abs } of jobs) {
      const v = verifyFile(abs);
      if (v.skip) continue;
      if (v.ok) pass += 1;
      else {
        fail += 1;
        fails.push(v);
      }
    }
    console.log('VERIFY pass:', pass, 'fail:', fail);
    fails.slice(0, 40).forEach((f) => {
      console.log(' FAIL', f.rel, 'expect', f.expect, 'cards', f.cardCount, 'btns', f.btnCount, 'section', f.hasSection, 'css', f.hasCss, 'ssr', f.hasSsr);
    });
    process.exit(fail ? 1 : 0);
  }

  let changed = 0;
  let cards = 0;
  const byCat = Object.create(null);
  for (const { abs, job, html } of jobs) {
    const res = injectJob(html, job, abs);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const cat = rel.split('/')[1] || 'other';
    byCat[cat] = (byCat[cat] || 0) + 1;
    const wouldWrite = res.changed || !verifyFileContent(res.html, abs).ok;
    if (wouldWrite) {
      changed += 1;
      cards += res.cardCount || job.packages.length;
      if (!DRY) fs.writeFileSync(abs, res.html, 'utf8');
      console.log((DRY ? 'DRY ' : 'OK  ') + rel + ' → ' + (res.cardCount || job.packages.length) + ' cards (' + (res.productId || job.product.id) + ')');
    } else {
      console.log('SKIP ' + rel + ' (already SSR, ' + job.packages.length + ' cards)');
    }
  }

  console.log('\nCategories:', JSON.stringify(byCat, null, 2));
  console.log((DRY ? 'Would update' : 'Updated') + ':', changed, 'pages · cards written ~', cards);
  if (DRY) console.log('(dry run — no files written)');
}

main();
