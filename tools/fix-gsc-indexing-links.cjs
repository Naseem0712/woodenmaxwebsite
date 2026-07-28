#!/usr/bin/env node
/**
 * GSC indexing helpers:
 * - Fix wrong noindex on pages that should rank
 * - Upgrade thin robots meta on city hubs
 * - Inject homepage city + blog discovery (internal links)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

const CITY_HUBS = [
  { slug: 'hyderabad', label: 'Hyderabad' },
  { slug: 'bangalore', label: 'Bengaluru' },
  { slug: 'delhi', label: 'Delhi NCR' },
  { slug: 'mumbai', label: 'Mumbai' },
  { slug: 'pune', label: 'Pune' },
  { slug: 'jaipur', label: 'Jaipur' },
  { slug: 'lucknow', label: 'Lucknow' }
];

const BLOG_POSTS = [
  { slug: 'aluminium-sliding-glass-door-complete-guide', label: 'Sliding glass door guide' },
  { slug: 'energy-efficient-windows-guide', label: 'Energy-efficient windows' },
  { slug: 'window-maintenance-tips', label: 'Window maintenance' },
  { slug: 'pergola-design-ideas-india', label: 'Pergola design ideas' },
  { slug: 'sliding-window-vs-folding-door-comparison', label: 'Sliding vs folding door' },
  { slug: 'frameless-sliding-doors-interior-partitions', label: 'Frameless sliding doors' },
  { slug: 'soundproof-windows-Hyderabad', label: 'Soundproof windows' },
  { slug: 'complete-woodenmax-products-guide', label: 'Full product guide' }
];

const DISCOVERY_MARKER = 'id="wm-index-discovery"';

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function upsertRobots(html, robots) {
  if (/<meta\s+name=["']robots["']/i.test(html)) {
    return html.replace(/<meta\s+name=["']robots["'][^>]*>/i, '<meta name="robots" content="' + robots + '" />');
  }
  return html.replace(/(<meta\s+name=["']viewport["'][^>]*>\s*)/i, '$1\n  <meta name="robots" content="' + robots + '" />');
}

function buildDiscoverySection() {
  const cityLinks = CITY_HUBS.map(function (c) {
    return '<a class="wm-discovery-link" href="/city/' + c.slug + '"><strong>' + c.label + ' hub</strong><span>Windows, glass &amp; install</span></a>';
  }).join('\n        ');

  const blogLinks = BLOG_POSTS.map(function (b) {
    return '<a class="wm-discovery-link" href="/blog/' + b.slug + '"><strong>' + b.label + '</strong><span>Expert guide</span></a>';
  }).join('\n        ');

  return (
    '\n  <section class="wm-index-discovery" ' + DISCOVERY_MARKER + ' aria-label="Cities and blog">\n' +
    '    <div class="container">\n' +
    '      <div class="wm-index-discovery-grid">\n' +
    '        <div class="wm-index-discovery-col">\n' +
    '          <h2>Cities we serve</h2>\n' +
    '          <p class="wm-index-discovery-lead">Local rate guides &amp; city hubs — linked for Google indexing from homepage.</p>\n' +
    '          <div class="wm-discovery-links">\n        ' + cityLinks + '\n' +
    '          </div>\n' +
    '          <p class="wm-index-discovery-more"><a href="/products/aluminium-windows#window-keywords">All city window rates →</a> · <a href="/products/glass-elevation">Glass elevation cities →</a></p>\n' +
    '        </div>\n' +
    '        <div class="wm-index-discovery-col">\n' +
    '          <h2>From our blog</h2>\n' +
    '          <p class="wm-index-discovery-lead">Guides on windows, glass, pergola &amp; maintenance — all indexable.</p>\n' +
    '          <div class="wm-discovery-links">\n        ' + blogLinks + '\n' +
    '          </div>\n' +
    '          <p class="wm-index-discovery-more"><a href="/blog">View all blog posts →</a></p>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </section>\n'
  );
}

const report = { cityRobots: 0, apiFix: 0, indexDiscovery: 0, hubCityStrip: 0 };

// 1. City hub robots — full index signals
CITY_HUBS.forEach(function (c) {
  const fp = path.join(ROOT, 'city', c.slug + '.html');
  if (!fs.existsSync(fp)) return;
  let html = fs.readFileSync(fp, 'utf8');
  const next = upsertRobots(html, INDEX_ROBOTS);
  if (next !== html) {
    fs.writeFileSync(fp, next, 'utf8');
    report.cityRobots++;
  }
});

// 2. API calculate — align meta with X-Robots-Tag noindex
const apiFp = path.join(ROOT, 'api/calculate/index.html');
if (fs.existsSync(apiFp)) {
  let html = fs.readFileSync(apiFp, 'utf8');
  const next = upsertRobots(html, 'noindex, nofollow');
  if (next !== html) {
    fs.writeFileSync(apiFp, next, 'utf8');
    report.apiFix = 1;
  }
}

// 3. Homepage discovery block
const indexFp = path.join(ROOT, 'index.html');
if (fs.existsSync(indexFp)) {
  let html = fs.readFileSync(indexFp, 'utf8');
  if (html.indexOf(DISCOVERY_MARKER) === -1) {
    html = html.replace(/\n  <!-- Footer: js\/site-footer\.js/, buildDiscoverySection() + '\n  <!-- Footer: js/site-footer.js');
    report.indexDiscovery = 1;
  }
  if (!html.includes('wm-index-discovery.css') && !html.includes('.wm-index-discovery{')) {
    const css =
      '\n  <style id="wm-index-discovery-css">' +
      '.wm-index-discovery{background:#f8fafc;border-top:1px solid #e2e8f0;padding:2.5rem 0 2rem}' +
      '.wm-index-discovery-grid{display:grid;grid-template-columns:1fr;gap:2rem}' +
      '@media(min-width:768px){.wm-index-discovery-grid{grid-template-columns:1fr 1fr}}' +
      '.wm-index-discovery h2{font-size:1.35rem;color:#0f172a;margin:0 0 .35rem}' +
      '.wm-index-discovery-lead{color:#64748b;font-size:.88rem;margin:0 0 .85rem;line-height:1.55}' +
      '.wm-discovery-links{display:grid;grid-template-columns:1fr;gap:.45rem}' +
      '@media(min-width:480px){.wm-discovery-links{grid-template-columns:1fr 1fr}}' +
      '.wm-discovery-link{display:flex;flex-direction:column;gap:.1rem;padding:.6rem .75rem;background:#fff;border:1px solid #e2e8f0;border-radius:8px;text-decoration:none;color:#0f172a}' +
      '.wm-discovery-link:hover{border-color:#93c5fd;background:#eff6ff}' +
      '.wm-discovery-link strong{font-size:.82rem;color:#1e40af}' +
      '.wm-discovery-link span{font-size:.74rem;color:#64748b}' +
      '.wm-index-discovery-more{margin:.75rem 0 0;font-size:.82rem}' +
      '.wm-index-discovery-more a{color:#1d4ed8;font-weight:600;text-decoration:none}' +
      '</style>';
    html = html.replace('</head>', css + '\n</head>');
  }
  if (report.indexDiscovery) fs.writeFileSync(indexFp, html, 'utf8');
}

// 4. Glass elevation + louvers hubs — city strip if missing
const hubStrips = [
  {
    file: 'products/glass-elevation.html',
    marker: 'id="glass-city-rates"',
    html:
      '\n  <section class="wm-keyword-map" id="glass-city-rates">\n' +
      '    <div class="container">\n' +
      '      <h2 class="cluster-h2">Glass elevation — city rate pages</h2>\n' +
      '      <p class="wm-keyword-map-lead">Local glass facade &amp; curtain wall intent — each city page is indexable and linked from this hub.</p>\n' +
      '      <div class="wm-keyword-map-grid">\n' +
      '        <a class="wm-keyword-map-link" href="./glass-elevation/glass-elevation-price-bangalore"><strong>Glass — Bengaluru</strong><span>Curtain wall rates</span></a>\n' +
      '        <a class="wm-keyword-map-link" href="./glass-elevation/glass-elevation-price-delhi"><strong>Glass — Delhi NCR</strong><span>Facade &amp; glazing</span></a>\n' +
      '        <a class="wm-keyword-map-link" href="./glass-elevation/glass-elevation-price-mumbai"><strong>Glass — Mumbai</strong><span>High-rise glass</span></a>\n' +
      '        <a class="wm-keyword-map-link" href="./glass-elevation/glass-elevation-price-pune"><strong>Glass — Pune</strong><span>Villa elevation</span></a>\n' +
      '        <a class="wm-keyword-map-link" href="./glass-elevation/glass-elevation-price-chandigarh"><strong>Glass — Chandigarh</strong><span>Modern facade</span></a>\n' +
      '        <a class="wm-keyword-map-link" href="./glass-elevation/glass-elevation-price-vijayawada"><strong>Glass — Vijayawada</strong><span>Commercial glass</span></a>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </section>\n'
  },
  {
    file: 'products/metal-louvers/index.html',
    marker: 'id="louver-city-rates"',
    html:
      '\n  <section class="wm-keyword-map" id="louver-city-rates">\n' +
      '    <div class="container">\n' +
      '      <h2 class="cluster-h2">Louvers — city rate pages</h2>\n' +
      '      <p class="wm-keyword-map-lead">Facade louver pricing by city — indexable local landing pages.</p>\n' +
      '      <div class="wm-keyword-map-grid">\n' +
      '        <a class="wm-keyword-map-link" href="./louver-price-delhi"><strong>Louvers — Delhi NCR</strong><span>Facade &amp; duct screening</span></a>\n' +
      '        <a class="wm-keyword-map-link" href="./louver-price-hyderabad"><strong>Louvers — Hyderabad</strong><span>Villa &amp; commercial</span></a>\n' +
      '        <a class="wm-keyword-map-link" href="./louver-price-jaipur"><strong>Louvers — Jaipur</strong><span>Heritage &amp; modern</span></a>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </section>\n'
  }
];

hubStrips.forEach(function (strip) {
  const fp = path.join(ROOT, strip.file);
  if (!fs.existsSync(fp)) return;
  let html = fs.readFileSync(fp, 'utf8');
  if (html.indexOf(strip.marker) !== -1) return;
  if (!html.includes('catalog-seo.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="[^"]*product-pages-global\.css[^"]*">\s*)/,
      '$1  <link rel="stylesheet" href="../css/catalog-seo.css?v=20260519">\n  '
    );
  }
  const insertAfter = html.match(/<section class="cluster-section catalog-hub-section--priority"/);
  if (insertAfter) {
    html = html.replace(/(<section class="cluster-section catalog-hub-section--priority"[\s\S]*?<\/section>\s*)/, '$1' + strip.html);
  } else {
    html = html.replace(/<\/header>/i, '</header>' + strip.html);
  }
  fs.writeFileSync(fp, html, 'utf8');
  report.hubCityStrip++;
});

console.log('Indexing link fixes:', report);
