import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pages } from './shower-seo-pages-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'products', 'shower-partitions');
/** Relative to generated files in products/shower-partitions/ — matches frameless-shower-partition.html */
const ASSET = '../../';

const CALC_SOURCES = {
  'frameless-shower-partition': {
    file: 'frameless-shower-partition.html',
    divId: 'price-calculator-frameless-shower-partition',
    script: 'frameless-shower.js',
  },
  'black-profile-shower-partition': {
    file: 'black-profile-shower-partition.html',
    divId: 'price-calculator-black-profile-shower-partition',
    script: 'black-profile-shower-sliding.js',
  },
  'premium-black-profile-shower': {
    file: 'premium-black-profile-shower.html',
    divId: 'price-calculator-premium-black-profile-shower',
    script: 'premium-black-profile-shower.js',
  },
  'slim-gold-profile-fluted-shower': {
    file: 'slim-frame-shower-partition.html',
    divId: 'price-calculator-slim-gold-profile-fluted-shower',
    script: 'gold-profile-fluted-shower.js',
  },
  'frosted-glass-bathroom-door': {
    file: 'frosted-glass-bathroom-door.html',
    divId: 'price-calculator-frosted-glass-bathroom-door',
    script: 'frosted-glass-door.js',
  },
};

/** @type {Record<string, string>} */
let calcHtmlCache = null;

function extractCalculatorDiv(html, divId) {
  const re = new RegExp(
    `<div\\s+id="${divId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`,
    'i'
  );
  const m = re.exec(html);
  if (!m) throw new Error(`Calculator div not found: ${divId}`);
  const start = m.index;
  let pos = m.index + m[0].length;
  let depth = 1;
  while (depth > 0 && pos < html.length) {
    const open = html.indexOf('<div', pos);
    const close = html.indexOf('</div>', pos);
    if (close === -1) break;
    if (open !== -1 && open < close) {
      depth++;
      pos = open + 4;
    } else {
      depth--;
      pos = close + 6;
    }
  }
  return html.slice(start, pos);
}

function loadCalculatorHtml(productKey) {
  if (!calcHtmlCache) calcHtmlCache = {};
  if (calcHtmlCache[productKey]) return calcHtmlCache[productKey];
  const src = CALC_SOURCES[productKey];
  const fp = path.join(root, 'products', 'shower-partitions', src.file);
  const html = fs.readFileSync(fp, 'utf8');
  calcHtmlCache[productKey] = extractCalculatorDiv(html, src.divId);
  return calcHtmlCache[productKey];
}

/** Calculator + copy matched to page intent (one full calc per page — unique DOM IDs). */
const CALC_BY_SLUG = {
  'glass-shower-partition-price': {
    key: 'frameless-shower-partition',
    heading: 'Glass shower partition — live price calculator',
    intro:
      'Hinged or sliding frameless-style package with L-corner support. Use it for straight runs and corner cubicles when you want hardware-inclusive totals.',
  },
  'sliding-shower-door-price': {
    key: 'black-profile-shower-partition',
    heading: 'Sliding shower door — soft-close track calculator',
    intro:
      'Top-track sliding system with profile options — aligned with sliding-door quotes (rollers, track, glass area).',
  },
  'fixed-glass-shower-panel-price': {
    key: 'frameless-shower-partition',
    heading: 'Fixed / open glass panel — price calculator',
    intro:
      'Use a single hinged panel or straight run to approximate fixed splash screens; adjust door type and sizes to match your opening.',
  },
  'shower-enclosure-price': {
    key: 'frameless-shower-partition',
    heading: 'Shower enclosure — L-corner & straight calculator',
    intro:
      'Full enclosure layouts: pick L-corner or straight, then door type. Suitable for most glass cubicle estimates.',
  },
  'frameless-glass-shower-price': {
    key: 'frameless-shower-partition',
    heading: 'Frameless glass shower — live calculator',
    intro: 'Profile-minimal package: 10mm logic, hinged or sliding, with hardware finishes.',
  },
  'bathroom-shower-design-price': {
    key: 'frameless-shower-partition',
    heading: 'Shower design budget — size & hardware calculator',
    intro: 'Ballpark a installed package from rough sizes before you freeze layout details.',
  },
  'small-bathroom-shower-design': {
    key: 'black-profile-shower-partition',
    heading: 'Compact bath — sliding shower calculator',
    intro: 'Sliding doors save swing space; use this when prioritising clearances near WC and vanity.',
  },
  'corner-shower-partition-price': {
    key: 'frameless-shower-partition',
    heading: 'Corner shower — dual-wall (L-corner) calculator',
    intro: 'Switch configuration to L-corner and enter both return widths for corner cubicles.',
  },
  'walk-in-shower-glass-price': {
    key: 'frameless-shower-partition',
    heading: 'Walk-in / partial glass — calculator',
    intro: 'Model a primary door panel or short return; sizes can follow your splash-screen layout.',
  },
  'shower-curtain-vs-glass-partition': {
    key: 'frameless-shower-partition',
    heading: 'Glass partition side — installed price calculator',
    intro: 'If you are leaning toward glass, estimate an installed glass package here; compare mentally with curtain first-cost.',
  },
  'framed-vs-frameless-shower': {
    key: 'premium-black-profile-shower',
    heading: 'Framed (profile) openable shower — calculator',
    intro:
      'Represents slim-profile framed / hinged packages. Pair mentally with frameless quotes from other guides.',
  },
  'shower-glass-thickness': {
    key: 'frameless-shower-partition',
    heading: 'Thickness & hardware — frameless calculator',
    intro: 'See how size and door type move totals; confirm final glass spec on site.',
  },
  'shower-glass-types': {
    key: 'frosted-glass-bathroom-door',
    heading: 'Frosted / clear glass options — calculator',
    intro:
      'Fold–slide and frosted-clear toggles suit privacy-first glass-type decisions; use for directional pricing.',
  },
  'shower-installation-cost': {
    key: 'frameless-shower-partition',
    heading: 'Installed shower package — calculator',
    intro:
      'Package includes typical installation line items in the estimator; complex sites may need a revised labour line.',
  },
  'shower-glass-maintenance': {
    key: 'black-profile-shower-partition',
    heading: 'Sliding system — price check (track care)',
    intro:
      'If you are upgrading a slider, estimate replacement-style pricing; daily maintenance still keeps tracks smooth.',
  },
};

const CLUSTER = [
  ['glass-shower-partition-price', 'Glass shower partition price'],
  ['sliding-shower-door-price', 'Sliding shower door price'],
  ['fixed-glass-shower-panel-price', 'Fixed glass shower panel price'],
  ['shower-enclosure-price', 'Shower enclosure price'],
  ['frameless-glass-shower-price', 'Frameless glass shower price'],
  ['bathroom-shower-design-price', 'Bathroom shower design with price'],
  ['small-bathroom-shower-design', 'Small bathroom shower design'],
  ['corner-shower-partition-price', 'Corner shower partition price'],
  ['walk-in-shower-glass-price', 'Walk-in shower glass price'],
  ['shower-curtain-vs-glass-partition', 'Shower curtain vs glass'],
  ['framed-vs-frameless-shower', 'Framed vs frameless shower'],
  ['shower-glass-thickness', 'Shower glass thickness'],
  ['shower-glass-types', 'Shower glass types'],
  ['shower-installation-cost', 'Shower installation cost'],
  ['shower-glass-maintenance', 'Shower glass maintenance'],
];

function injectArticleFigures(articleBody, img1path, img2path, p) {
  const fig1 = `<figure class="seo-article-figure"><img class="shower-seo-inline-img" src="${img1path}" alt="${esc(p.alt1)}" width="640" height="427" fetchpriority="high" loading="eager" decoding="async" /></figure>`;
  const fig2 = `<figure class="seo-article-figure"><img class="shower-seo-inline-img" src="${img2path}" alt="${esc(p.alt2)}" width="640" height="427" loading="lazy" decoding="async" /></figure>`;
  return articleBody.replace('__FIG1__', fig1).replace('__FIG2__', fig2);
}

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Compact type map: all 15 articles grouped — same on every page aside */
const SHOWER_TYPES_ASIDE_HTML = `<div class="seo-cluster-types-wrap">
      <p class="seo-cluster-label">Types of shower partitions</p>
      <p class="seo-cluster-links seo-cluster-types-line"><span class="seo-cluster-types-key">By layout:</span> <a href="/walk-in-shower-glass-price">Walk-in</a><span class="seo-cluster-sep"> · </span><a href="/corner-shower-partition-price">Corner / L-shape</a><span class="seo-cluster-sep"> · </span><a href="/fixed-glass-shower-panel-price">Fixed panel</a><span class="seo-cluster-sep"> · </span><a href="/shower-enclosure-price">Enclosure</a></p>
      <p class="seo-cluster-links seo-cluster-types-line"><span class="seo-cluster-types-key">By door:</span> <a href="/sliding-shower-door-price">Sliding</a><span class="seo-cluster-sep"> · </span><a href="/frameless-glass-shower-price">Frameless</a><span class="seo-cluster-sep"> · </span><a href="/glass-shower-partition-price">Partition pricing</a></p>
      <p class="seo-cluster-links seo-cluster-types-line"><span class="seo-cluster-types-key">Design &amp; space:</span> <a href="/bathroom-shower-design-price">Bathroom design &amp; price</a><span class="seo-cluster-sep"> · </span><a href="/small-bathroom-shower-design">Small bathroom</a></p>
      <p class="seo-cluster-links seo-cluster-types-line"><span class="seo-cluster-types-key">Glass &amp; install:</span> <a href="/shower-glass-thickness">Thickness</a><span class="seo-cluster-sep"> · </span><a href="/shower-glass-types">Glass types</a><span class="seo-cluster-sep"> · </span><a href="/shower-installation-cost">Installation cost</a><span class="seo-cluster-sep"> · </span><a href="/shower-glass-maintenance">Maintenance</a></p>
      <p class="seo-cluster-links seo-cluster-types-line"><span class="seo-cluster-types-key">Calculators:</span> <a href="frameless-shower-partition">Frameless</a><span class="seo-cluster-sep"> · </span><a href="black-profile-shower-partition">Black sliding</a><span class="seo-cluster-sep"> · </span><a href="premium-black-profile-shower">Black openable</a><span class="seo-cluster-sep"> · </span><a href="slim-frame-shower-partition">Gold fluted</a><span class="seo-cluster-sep"> · </span><a href="frosted-glass-bathroom-door">Frosted fold-slide</a></p>
      <p class="seo-cluster-links seo-cluster-types-line"><span class="seo-cluster-types-key">Compare:</span> <a href="/framed-vs-frameless-shower">Framed vs frameless</a><span class="seo-cluster-sep"> · </span><a href="/shower-curtain-vs-glass-partition">Curtain vs glass</a></p>
    </div>`;

function clusterLinksHtml(currentSlug) {
  const items = CLUSTER.filter(([slug]) => slug !== currentSlug)
    .map(
      ([slug, label]) =>
        `<a href="/${slug}">${esc(label)}</a>`
    )
    .join('<span class="seo-cluster-sep"> · </span>');
  return `<aside class="seo-cluster-aside" aria-label="Shower SEO cluster links">
      <p class="seo-cluster-hub-lead"><a href="../shower-partitions#shower-seo-guide-index">Shower partitions hub</a> — all 15 articles + product calculators listed together. <a href="../shower-partitions#shower-partition-types-panel">Types of shower partitions</a> on the hub.</p>
      ${SHOWER_TYPES_ASIDE_HTML}
      <p class="seo-cluster-label">Related articles (internal links)</p>
      <p class="seo-cluster-links">${items}</p>
    </aside>`;
}

/** Same-folder product detail pages — live calculators */
const RELATED_SHOWER_PRODUCTS = [
  ['frameless-shower-partition', 'Frameless shower partition', 'Walk-in / hinged / sliding — 10mm toughened calculator'],
  ['black-profile-shower-partition', 'Black profile soft-close sliding', 'Track & rollers — sliding shower calculator'],
  ['premium-black-profile-shower', 'Premium black profile openable', 'Slim profile hinged package calculator'],
  ['slim-frame-shower-partition', 'Slim gold-frame fluted shower', 'Designer fluted glass calculator'],
  ['frosted-glass-bathroom-door', 'Frosted fold & slide bathroom door', 'Privacy fold–slide calculator'],
];

function relatedProductsSection() {
  const lis = RELATED_SHOWER_PRODUCTS.map(
    ([slug, name, blurb]) =>
      `<li><a href="${slug}"><strong>${esc(name)}</strong></a> — ${esc(blurb)}</li>`
  ).join('\n');
  return `<aside class="seo-related-products" aria-label="Related shower partition products">
      <h2 class="section-title">Shop shower partitions (live calculators)</h2>
      <p class="seo-related-intro">Each product page includes a full glass + hardware estimator. Use the hub to compare every article and every range.</p>
      <ul class="seo-related-products-list">${lis}</ul>
      <p class="seo-related-hub"><a href="../shower-partitions#shower-seo-guide-index"><strong>Shower hub — all articles &amp; products</strong></a></p>
    </aside>`;
}

function metaKeywordsFromPage(p) {
  const focus = p.slug.replace(/-/g, ' ');
  return `${focus}, shower glass India, bathroom shower partition, toughened glass shower, shower price calculator, WoodenMax`;
}

function organizationSchemaJson() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://woodenmax.in/#organization',
    name: 'WoodenMax',
    url: 'https://woodenmax.in',
    logo: {
      '@type': 'ImageObject',
      url: 'https://woodenmax.in/images/woodenmax-logo.webp',
    },
  });
}

function websiteSchemaJson() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://woodenmax.in/#website',
    name: 'WoodenMax',
    url: 'https://woodenmax.in',
    publisher: { '@id': 'https://woodenmax.in/#organization' },
  });
}

function articleSchemaJson(p, canonical, img1url) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.metaDesc,
    image: [img1url],
    author: {
      '@type': 'Organization',
      name: 'WoodenMax',
      url: 'https://woodenmax.in',
    },
    publisher: { '@id': 'https://woodenmax.in/#organization' },
    datePublished: '2026-01-15',
    dateModified: '2026-04-28',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
    },
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'Bathroom shower partitions hub',
      url: 'https://woodenmax.in/products/shower-partitions',
    },
    inLanguage: 'en-IN',
  });
}

function productListSchemaJson() {
  const items = RELATED_SHOWER_PRODUCTS.map(([slug, name], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: `https://woodenmax.in/products/shower-partitions/${slug}`,
  }));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'WoodenMax shower partition products',
    description: 'Live calculator product pages for bathroom shower glass',
    numberOfItems: items.length,
    itemListElement: items,
  });
}

function comparisonSection(p) {
  return `<h2 class="section-title">Comparison snapshot (typical India bands, indicative)</h2>
      <p class="seo-compare-intro">Use this table to shortlist a direction, then run the calculator above for your exact sizes.</p>
      <div class="shower-seo-compare-wrap">
        <table class="shower-seo-compare-table">
          <thead><tr><th>Solution</th><th>Best when</th><th>₹/sqft hint</th><th>Article</th></tr></thead>
          <tbody>
            <tr><td>Glass partition (hinged / fixed run)</td><td>Standard wet zone, need door swing or fixed screen</td><td>Wide band — check calc</td><td><a href="/glass-shower-partition-price">Partition price</a></td></tr>
            <tr><td>Sliding shower door</td><td>Tight clearances, long openings</td><td>Often project quotes ₹12k–45k</td><td><a href="/sliding-shower-door-price">Sliding price</a></td></tr>
            <tr><td>Corner / enclosure</td><td>Splash control priority</td><td>Area + hardware</td><td><a href="/shower-enclosure-price">Enclosure price</a></td></tr>
            <tr><td>Walk-in partial glass</td><td>Minimal door, good drainage</td><td>Panel-heavy</td><td><a href="/walk-in-shower-glass-price">Walk-in</a></td></tr>
            <tr><td>Frameless minimal metal</td><td>Premium look, easier wipe-down</td><td>Higher fittings</td><td><a href="/frameless-glass-shower-price">Frameless price</a></td></tr>
          </tbody>
        </table>
      </div>
      <p class="shower-seo-compare-foot">Related decisions: <a href="/shower-curtain-vs-glass-partition">Curtain vs glass</a> · <a href="/framed-vs-frameless-shower">Framed vs frameless</a> · <a href="/shower-glass-thickness">Thickness</a> · <a href="/shower-glass-types">Glass types</a></p>`;
}

function calcSection(p) {
  const cfg = CALC_BY_SLUG[p.slug];
  if (!cfg) throw new Error('Missing CALC_BY_SLUG for ' + p.slug);
  const inner = loadCalculatorHtml(cfg.key);
  const divId = CALC_SOURCES[cfg.key].divId;
  return `<section class="seo-shower-calculator-section" id="shower-price-calculator">
    <div class="container">
      <h2 class="section-title">${esc(cfg.heading)}</h2>
      <p class="seo-shower-calculator-intro">${esc(cfg.intro)}</p>
      <div class="seo-shower-calculator-wrap">${inner}</div>
      <p class="seo-shower-calculator-actions"><a href="https://wa.me/917895328080?text=${encodeURIComponent('Shower quote — page: ' + p.slug + '. Sizes: __ × __ ft. City: __')}" class="btn btn-outline" rel="noopener" target="_blank">WhatsApp sizes</a> <a href="${ASSET}contact.html" class="btn btn-outline">Contact</a></p>
    </div>
  </section>
  <a href="#${divId}" class="floating-calc-button" aria-label="Scroll to calculator">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8M16 14v4M16 10h.01M12 10h.01M8 10h.01"/></svg>
    <span class="floating-calc-button-text">Calculator</span>
  </a>`;
}

function calcScripts(p) {
  const cfg = CALC_BY_SLUG[p.slug];
  const script = CALC_SOURCES[cfg.key].script;
  return `<script src="${ASSET}js/email-submitter.js"></script>
  <script src="${ASSET}js/calculator/configs.js" defer></script>
  <script src="${ASSET}js/calculator/base.js" defer></script>
  <script src="${ASSET}js/calculator/extensions/${script}" defer></script>
  <script src="${ASSET}js/calculator/loader.js" defer></script>
  <script src="${ASSET}js/calculator/smooth-typing-indicator.js" defer></script>
  <script src="${ASSET}js/floating-calc-button.js" defer></script>`;
}

function faqSchema(p) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: p.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });
}

function pageCanonical(p) {
  return `https://woodenmax.in/${p.slug}`;
}

function breadcrumbSchema(p) {
  const canonical = pageCanonical(p);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://woodenmax.in/' },
      { '@type': 'ListItem', position: 2, name: 'Catalog', item: 'https://woodenmax.in/catalog' },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Shower Partitions',
        item: 'https://woodenmax.in/products/shower-partitions',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: p.h1.replace(/</g, ' '),
        item: canonical,
      },
    ],
  });
}

function serviceSchemaJson(p) {
  const canonical = pageCanonical(p);
  const cfg = CALC_BY_SLUG[p.slug];
  const divId = CALC_SOURCES[cfg.key].divId;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: cfg.heading,
    description: cfg.intro,
    serviceType: 'Shower glass price calculator',
    url: `${canonical}#${divId}`,
    areaServed: { '@type': 'Country', name: 'India' },
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'INR',
      description: 'Online estimate; final price after site measurement',
    },
  });
}

function itemListRelatedJson(p) {
  const items = CLUSTER.filter(([slug]) => slug !== p.slug).map(([slug, label], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: label,
    item: `https://woodenmax.in/${slug}`,
  }));
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Related shower articles',
    itemListElement: items,
  });
}

function buildPage(p) {
  const canonical = pageCanonical(p);
  const img1path = encodeURI(`${ASSET}images/products/${p.imgFolder}/${p.img1}`);
  const img2path = encodeURI(`${ASSET}images/products/${p.imgFolder}/${p.img2}`);
  const img1url = `https://woodenmax.in/images/products/${encodeURI(`${p.imgFolder}/${p.img1}`)}`;
  const calcAnchor = `#${CALC_SOURCES[CALC_BY_SLUG[p.slug].key].divId}`;

  const faqHtml = p.faqs
    .map(
      (f) => `<div class="seo-faq-item">
        <h3>${esc(f.q)}</h3>
        <p>${esc(f.a)}</p>
      </div>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en-IN" dir="ltr">
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-H3574PEDBK"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-H3574PEDBK', { 'engagement_time_msec': 0, 'session_engaged': true });
  </script>
  <script defer src="${ASSET}js/analytics.js"></script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.metaDesc)}" />
  <meta name="keywords" content="${esc(metaKeywordsFromPage(p))}" />
  <meta name="author" content="WoodenMax" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${canonical}" />
  <link rel="image_src" href="${img1url}" />
  <meta name="image" content="${img1url}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${esc(p.title)}" />
  <meta property="og:description" content="${esc(p.metaDesc)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${img1url}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="800" />
  <meta property="og:site_name" content="WoodenMax" />
  <meta property="og:locale" content="en_IN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(p.title)}" />
  <meta name="twitter:description" content="${esc(p.metaDesc)}" />
  <meta name="twitter:image" content="${img1url}" />
  <meta name="twitter:image:alt" content="${esc(p.alt1)}" />
  <script type="application/ld+json">${organizationSchemaJson()}</script>
  <script type="application/ld+json">${websiteSchemaJson()}</script>
  <script type="application/ld+json">${breadcrumbSchema(p)}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name: p.title,
    description: p.metaDesc,
    url: canonical,
    inLanguage: 'en-IN',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://woodenmax.in/#website',
      name: 'WoodenMax',
      url: 'https://woodenmax.in',
      publisher: { '@id': 'https://woodenmax.in/#organization' },
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: img1url,
      width: 1200,
      height: 800,
      caption: p.alt1,
    },
    publisher: { '@id': 'https://woodenmax.in/#organization' },
  })}</script>
  <script type="application/ld+json">${articleSchemaJson(p, canonical, img1url)}</script>
  <script type="application/ld+json">${faqSchema(p)}</script>
  <script type="application/ld+json">${serviceSchemaJson(p)}</script>
  <script type="application/ld+json">${itemListRelatedJson(p)}</script>
  <script type="application/ld+json">${productListSchemaJson()}</script>
  <link rel="icon" type="image/x-icon" href="${ASSET}favicon.ico" />
  <link rel="stylesheet" href="${ASSET}css/styles.css" />
  <link rel="stylesheet" href="${ASSET}css/calculator-global.css" />
  <link rel="stylesheet" href="${ASSET}css/product-pages-global.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
  <link rel="preload" as="image" href="${img1path}" />
</head>
<body class="morning-seo-page">
  <nav class="navbar scrolled" id="navbar">
    <div class="container">
      <div class="navbar-content">
        <a href="${ASSET}index" class="navbar-logo">
          <div class="logo-icon"><img src="${ASSET}images/woodenmax-logo.webp" alt="Site logo" ></div>
        </a>
        <div class="nav-menu">
          <a href="${ASSET}index" class="nav-link">Home</a>
          <div class="category-carousel-wrapper">
            <button class="carousel-nav prev" id="catPrev"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button>
            <div class="category-carousel" id="categoryCarousel">
              <a href="../aluminium-windows" class="cat-item">Aluminium</a>
              <a href="../telescope-windows" class="cat-item">Telescope</a>
              <a href="../folding-systems" class="cat-item">Folding</a>
              <a href="../metal-louvers" class="cat-item">Louvers</a>
              <a href="../shower-partitions" class="cat-item active">Shower</a>
              <a href="../elevation-cladding" class="cat-item">Elevation</a>
              <a href="../glass-elevation" class="cat-item">Glass</a>
              <a href="../glass-railing" class="cat-item">Railing</a>
              <a href="../grills" class="cat-item" data-index="8">Grills</a>
            </div>
            <button class="carousel-nav next" id="catNext"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>
          </div>
          <a href="${ASSET}about" class="nav-link">About</a>
          <a href="${ASSET}contact.html" class="nav-link">Contact</a>
        </div>
        <div class="nav-cta"><a href="tel:+917895328080"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call</a></div>
        <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="menuIcon"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="closeIcon" class="mobile-nav-close-icon"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </div>
  </nav>

  <div class="mobile-menu" id="mobileMenu">
    <div class="mobile-menu-content">
      <a href="${ASSET}index" class="mobile-nav-item">Home</a>
      <div class="mobile-category-grid">
        <a href="../aluminium-windows" class="mobile-cat-item"><span>Aluminium</span></a>
        <a href="../telescope-windows" class="mobile-cat-item"><span>Telescope</span></a>
        <a href="../folding-systems" class="mobile-cat-item"><span>Folding</span></a>
        <a href="../metal-louvers" class="mobile-cat-item"><span>Louvers</span></a>
        <a href="../shower-partitions" class="mobile-cat-item mobile-cat-item--shower-active"><span>Shower</span></a>
        <a href="../elevation-cladding" class="mobile-cat-item"><span>Elevation</span></a>
        <a href="../glass-elevation" class="mobile-cat-item"><span>Glass</span></a>
        <a href="../glass-railing" class="mobile-cat-item"><span>Railing</span></a>
        <a href="../grills" class="mobile-cat-item"><span class="mobile-cat-icon">🔒</span><span>Grills</span></a>
      </div>
      <a href="${ASSET}about" class="mobile-nav-item">About Us</a>
      <a href="${ASSET}contact.html" class="mobile-nav-item">Contact Us</a>
      <div class="mobile-menu-footer">
        <a href="tel:+917895328080" class="cta-btn"> Call Now</a>
      </div>
    </div>
  </div>

  <div class="seo-breadcrumb-bar">
    <div class="container">
      <nav class="seo-breadcrumb" aria-label="Breadcrumb">
        <a href="${ASSET}index">Home</a>
        <span class="seo-breadcrumb-sep">/</span>
        <a href="${ASSET}catalog">Catalog</a>
        <span class="seo-breadcrumb-sep">/</span>
        <a href="../shower-partitions">Shower Partitions</a>
        <span class="seo-breadcrumb-sep">/</span>
        <span class="seo-breadcrumb-current">${esc(p.h1)}</span>
      </nav>
    </div>
  </div>

  <section class="product-detail-hero">
    <div class="container">
      <span class="section-label">${esc(p.sectionLabel)}</span>
      <h1 class="seo-page-h1">${esc(p.h1)}</h1>
      <div class="seo-hero-prose">${p.heroP}</div>
      <div class="seo-hero-actions">
        <a href="${calcAnchor}" class="btn btn-primary">Jump to live calculator</a>
        <a href="https://wa.me/917895328080?text=${encodeURIComponent('Hi — shower glass quote. Page: ' + p.slug + '. Sizes & city: __')}" class="btn btn-outline" rel="noopener" target="_blank">WhatsApp quote</a>
        <a href="${ASSET}contact.html?product=${encodeURIComponent(p.slug)}" class="btn btn-outline">Contact</a>
      </div>
      ${clusterLinksHtml(p.slug)}
    </div>
  </section>

  ${calcSection(p)}

  <section class="seo-content-section">
    <div class="container seo-content-narrow">
      ${injectArticleFigures(p.articleBody, img1path, img2path, p)}
      ${comparisonSection(p)}
      ${relatedProductsSection()}
    </div>
  </section>

  <section class="seo-faq-section" id="faqs">
    <div class="container seo-faq-narrow">
      <h2 class="section-title">FAQs</h2>
      ${faqHtml}
      <p class="seo-faq-footer"><a href="../shower-partitions#shower-seo-guide-index">← Shower hub — all 15 articles</a> · <a href="../shower-partitions">Product range</a> · <a href="frameless-shower-partition">Frameless calculator</a> · <a href="black-profile-shower-partition">Sliding calculator</a></p>
    </div>
  </section>

  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            <div class="footer-brand-icon"><img src="${ASSET}images/woodenmax-logo.webp" alt="Logo" ></div>
          </div>
          <p class="footer-description">Neutral shower glass price &amp; design articles (India).</p>
        </div>
        <div>
          <h3 class="footer-title">Quick Links</h3>
          <ul class="footer-links">
            <li><a href="${ASSET}index">Home</a></li>
            <li><a href="${ASSET}catalog">Catalog</a></li>
            <li><a href="../shower-partitions">Shower hub</a></li>
            <li><a href="${ASSET}contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-title">Products</h3>
          <ul class="footer-links">
            <li><a href="../aluminium-windows">Aluminium windows</a></li>
            <li><a href="../glass-railing">Glass railing</a></li>
            <li><a href="../folding-systems">Folding systems</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-title">Contact</h3>
          <p class="seo-footer-contact-phone">+91 789-5328080</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026</p>
      </div>
    </div>
  </footer>

  <script src="${ASSET}js/main.js"></script>
  ${calcScripts(p)}
  <script src="${ASSET}js/mobile-collapsible-sections.js" defer></script>
</body>
</html>`;
}

fs.mkdirSync(outDir, { recursive: true });
for (const p of pages) {
  const fp = path.join(outDir, `${p.slug}.html`);
  fs.writeFileSync(fp, buildPage(p), 'utf8');
  console.log('Wrote', fp);
}
