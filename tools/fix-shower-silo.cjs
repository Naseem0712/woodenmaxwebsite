#!/usr/bin/env node
/**
 * Shower silo cannibalization fix + city pages + sitemap entries.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SHOWER_DIR = path.join(ROOT, 'products', 'shower-partitions');
const HUB_BACK = `<p class="seo-hub-back" style="margin:0 0 1rem;"><a href="../shower-partitions" style="color:#1E40AF;font-weight:600;text-decoration:none;">← All shower partition prices</a></p>`;

const GUIDE_FILES = [
  'glass-shower-partition-price.html',
  'walk-in-shower-glass-price.html',
  'shower-curtain-vs-glass-partition.html',
  'sliding-shower-door-price.html',
  'bathroom-shower-design-price.html',
  'corner-shower-partition-price.html',
  'shower-enclosure-price.html',
  'shower-glass-maintenance.html',
  'framed-vs-frameless-shower.html',
  'shower-glass-types.html',
  'shower-glass-thickness.html',
  'shower-installation-cost.html',
  'small-bathroom-shower-design.html',
  'frameless-glass-shower-price.html',
  'fixed-glass-shower-panel-price.html',
];

function setMeta(html, { title, description }) {
  const t = description.replace(/"/g, '&quot;');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${t}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${title.replace(/&/g, '&amp;')}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${t}" />`
  );
  if (html.includes('twitter:title')) {
    html = html.replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${title.replace(/&/g, '&amp;')}" />`
    );
    html = html.replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${t}" />`
    );
  }
  return html;
}

function addHubBackToGuide(html) {
  if (html.includes('seo-hub-back')) return html;
  return html.replace(
    /(<section class="product-detail-hero">\s*<div class="container">)/,
    `$1\n      ${HUB_BACK}`
  );
}

function addHubBackToProduct(html) {
  if (html.includes('seo-hub-back')) return html;
  return html.replace(
    /(<!-- PRODUCT HERO -->\s*<section class="product-detail-hero">\s*<div class="container">)/,
    `$1\n      ${HUB_BACK}`
  );
}

function fixGlassPricePage() {
  const file = path.join(SHOWER_DIR, 'glass-shower-partition-price.html');
  let html = fs.readFileSync(file, 'utf8');
  const title =
    'Glass Shower Partition Price Per Sqft (2026) — 8mm vs 10mm Rate Breakdown | WoodenMax';
  const desc =
    'Glass shower partition price per sqft India 2026 — ₹440–1,320/sqft rate breakdown for 8mm vs 10mm toughened glass. Standard 3×5 ft shower ≈ ₹11,000–18,000. Live calculator.';
  html = setMeta(html, { title, description: desc });
  html = html.replace(
    /<h1 class="seo-page-h1">[^<]*<\/h1>/,
    '<h1 class="seo-page-h1">Glass Shower Partition Price Per Sqft (2026) — 8mm vs 10mm Rate Breakdown</h1>'
  );
  html = html.replace(
    /<div class="seo-hero-prose"><p><strong>Bathroom partition glass<\/strong>[\s\S]*?<\/div>/,
    `<div class="seo-hero-prose"><p><strong>Glass shower partition price per sqft</strong> depends on toughened glass thickness (8mm vs 10mm), door type (hinged or sliding), and hardware grade. In India, typical installed rates run <strong>₹440–1,320 per sq ft</strong>.</p>
<p><strong>Quick answer:</strong> standard 3×5 ft (15 sq ft) shower ≈ <strong>₹11,000–18,000</strong> total · 8mm frameless from <strong>₹440/sqft</strong> · 10mm premium packages <strong>₹660–1,320/sqft</strong>. Use the live calculator below for your exact size — GST 18% extra.</p></div>`
  );
  html = html.replace(/"name": "Glass Shower Partition Price in India \| Per Sqft & Thickness"/g, '"name": "Glass Shower Partition Price Per Sqft — 8mm vs 10mm Rate Breakdown"');
  html = html.replace(/"headline":"Glass Shower Partition Price in India \| Per Sqft & Thickness"/g, '"headline":"Glass Shower Partition Price Per Sqft — 8mm vs 10mm Rate Breakdown"');
  html = html.replace(
    /Glass shower partition price India 2026: per-sqft bands, 8mm vs 10mm cost/g,
    'Glass shower partition price per sqft India 2026 — 8mm vs 10mm rate breakdown'
  );
  html = html.replace(
    /<span class="seo-breadcrumb-current">[^<]*<\/span>/,
    '<span class="seo-breadcrumb-current">Glass Shower Partition Price Per Sqft</span>'
  );
  html = addHubBackToGuide(html);
  fs.writeFileSync(file, html, 'utf8');
  console.log('  ✓ glass-shower-partition-price.html');
}

function fixFramelessPage() {
  const file = path.join(SHOWER_DIR, 'frameless-shower-partition.html');
  let html = fs.readFileSync(file, 'utf8');
  const title =
    'Frameless Shower Price India (2026) — Walk-in Glass Enclosure ₹440–1,320/sqft | WoodenMax';
  const desc =
    'Frameless shower price India — walk-in glass enclosure from ₹440/sqft. 10mm toughened, hinged or sliding, L-corner & straight. Live calculator. Free site measurement.';
  html = setMeta(html, { title, description: desc });
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${title}</title>`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="Frameless Shower Price India (2026) — Walk-in Glass Enclosure | WoodenMax" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="Frameless Shower Price India (2026) — Walk-in Glass Enclosure | WoodenMax" />`
  );
  html = html.replace(
    /<h1 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 0 0 0.5rem; color: #0F172A;">Luxury Frameless Shower Enclosure <span style="font-size:0.55em; color:#64748b; display:block; margin-top:0.25rem;">Walk-in Frameless Shower Glass Door &amp; Bathroom Partition<\/span><\/h1>/,
    '<h1 style="font-family: \'Playfair Display\', serif; font-size: 2.5rem; margin: 0 0 0.5rem; color: #0F172A;">Frameless Shower Price — Walk-in Glass Enclosure <span style="font-size:0.55em; color:#64748b; display:block; margin-top:0.25rem;">10mm toughened · hinged or sliding</span></h1>'
  );
  html = html.replace(
    /"name": "Luxury Frameless Shower Enclosure — Walk-in Frameless Shower Glass Door"/g,
    '"name": "Frameless Shower — Walk-in Glass Enclosure"'
  );
  html = addHubBackToProduct(html);
  fs.writeFileSync(file, html, 'utf8');
  console.log('  ✓ frameless-shower-partition.html');
}

function addHubBackToAllGuides() {
  for (const f of GUIDE_FILES) {
    const abs = path.join(SHOWER_DIR, f);
    if (!fs.existsSync(abs)) continue;
    let html = fs.readFileSync(abs, 'utf8');
    const updated = addHubBackToGuide(html);
    if (updated !== html) {
      fs.writeFileSync(abs, updated, 'utf8');
      console.log('  + hub link:', f);
    }
  }
}

function buildCityPage(cfg) {
  const slug = cfg.slug;
  const url = `https://woodenmax.in/products/shower-partitions/${slug}`;
  const img = 'https://woodenmax.in/images/products/shower-partitions/frameless-shower-glass-door-openable-sliding-india.webp';
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
  <script defer src="../../js/analytics.js?v=20260601"></script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${cfg.title}</title>
  <meta name="description" content="${cfg.description.replace(/"/g, '&quot;')}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${url}" />
  <link rel="image_src" href="${img.replace('.webp', '-1200.webp')}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${cfg.title.replace(/&/g, '&amp;')}" />
  <meta property="og:description" content="${cfg.description.replace(/"/g, '&quot;')}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${img.replace('.webp', '-1200.webp')}" />
  <meta property="og:site_name" content="WoodenMax" />
  <meta property="og:locale" content="en_IN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${cfg.title.replace(/&/g, '&amp;')}" />
  <meta name="twitter:description" content="${cfg.description.replace(/"/g, '&quot;')}" />
  <link rel="stylesheet" href="../../css/styles.css">
  <link rel="stylesheet" href="../../css/product-pages-global.css?v=20260601">
  <link rel="stylesheet" href="../../css/cluster-pages.css">
  <link rel="stylesheet" href="../../css/catalog-seo.css">
  <link rel="stylesheet" href="../../css/site-nav.css?v=20260601">
  <link rel="stylesheet" href="../../css/site-footer.css">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cfg.h1,
    description: cfg.description,
    image: img,
    brand: { '@type': 'Brand', name: 'WoodenMax', url: 'https://woodenmax.in' },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: 440,
      highPrice: 1320,
      offerCount: 1,
      availability: 'https://schema.org/InStock',
      url,
    },
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://woodenmax.in/' },
      { '@type': 'ListItem', position: 2, name: 'Shower Partitions', item: 'https://woodenmax.in/products/shower-partitions' },
      { '@type': 'ListItem', position: 3, name: cfg.h1, item: url },
    ],
  })}</script>
</head>
<body class="cluster-page silo-shower catalog-seo-page">
<nav class="cluster-breadcrumb" aria-label="Breadcrumb"><div class="container"><a href="../../">Home</a><span aria-hidden="true"> &rsaquo; </span><a href="../../catalog">Catalog</a><span aria-hidden="true"> &rsaquo; </span><a href="../shower-partitions">Shower partitions</a><span aria-hidden="true"> &rsaquo; </span><strong>${cfg.h1}</strong></div></nav>

<header class="cluster-hero">
  <div class="container cluster-hero-grid">
    <div class="cluster-hero-text">
      <p style="margin:0 0 1rem;"><a href="../shower-partitions" style="color:#1E40AF;font-weight:600;text-decoration:none;">← All shower partition prices</a></p>
      <h1>${cfg.h1}</h1>
      <p class="cluster-hero-sub">${cfg.heroSub}</p>
      <div class="cluster-hero-cta">
        <a href="../shower-partitions#shower-products" class="cluster-cta-primary">Use shower calculators on hub &rarr;</a>
        <a href="../../contact?intent=shower-quote&amp;city=${cfg.cityKey}" class="cluster-cta-secondary">Book free site visit</a>
      </div>
    </div>
    <div class="cluster-hero-media"><figure class="cluster-hero-figure"><img class="catalog-hero-product-img" src="../../images/products/shower-partitions/frameless-shower-glass-door-openable-sliding-india.webp" alt="Shower glass partition installation ${cfg.cityName} — WoodenMax" width="800" height="600" loading="eager" decoding="async"></figure></div>
  </div>
</header>

<section class="cluster-section">
  <div class="container">
    <h2 class="cluster-h2">Shower glass partition price in ${cfg.cityName}</h2>
    <div class="cluster-prose">
      <p>Typical installed rates: <strong>₹440–1,320 per sq ft</strong> depending on frameless walk-in, black profile sliding, or frosted fold-slide finish. A standard <strong>3×5 ft shower ≈ ₹11,000–18,000</strong> total (GST 18% extra).</p>
      <p><strong>Areas we serve in ${cfg.cityName}:</strong> ${cfg.areas}.</p>
      <ul>
        <li><strong>Free site measurement</strong> — we visit your bathroom, confirm drain slope &amp; wall fixing points</li>
        <li><strong>Installation in 1 day</strong> for most standard straight or L-corner showers</li>
        <li><strong>8–10mm toughened glass</strong> with hotel-grade hinges, rollers &amp; anti-fungal silicone</li>
      </ul>
      <p>Compare all types on the <a href="../shower-partitions">shower partitions hub</a> — frameless, sliding, premium black profile &amp; frosted options with live calculators.</p>
    </div>
  </div>
</section>

<section class="cluster-section cluster-section-alt">
  <div class="container">
    <h2 class="cluster-h2">Popular shower types in ${cfg.cityName}</h2>
    <div class="cluster-table-wrap">
      <table class="cluster-table">
        <thead><tr><th>Type</th><th>Rate (₹/sqft)</th><th>Best for</th></tr></thead>
        <tbody>
          <tr><td><a href="frameless-shower-partition">Frameless walk-in</a></td><td>₹440–1,320</td><td>Master bath, luxury apartments</td></tr>
          <tr><td><a href="black-profile-shower-partition">Black profile sliding</a></td><td>₹660–1,320</td><td>Long dry zones, matte look</td></tr>
          <tr><td><a href="frosted-glass-bathroom-door">Frosted fold &amp; slide</a></td><td>₹770–1,320</td><td>Compact bathrooms</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="cluster-final-cta">
  <div class="container">
    <h2>Get a ${cfg.cityName} shower quote</h2>
    <p>WhatsApp your bathroom size &amp; locality — we confirm exact ₹/sqft after free measurement.</p>
    <a href="https://wa.me/917895328080?text=Hi%20WoodenMax%20%E2%80%94%20shower%20partition%20quote%20in%20${encodeURIComponent(cfg.cityName)}.%203%C3%975%20ft%20approx.%20Locality%3A%20__" class="cluster-cta-primary" rel="noopener" target="_blank">WhatsApp for ${cfg.cityName} quote &rarr;</a>
  </div>
</section>

<script src="../../js/nav-tree.js?v=20260520" defer></script>
<script src="../../js/site-nav.js?v=20260520" defer></script>
<script src="../../js/site-footer.js?v=20260601" defer></script>
<script src="../../js/seo-enhancer.js?v=20260520" defer></script>
</body>
</html>
`;
}

const CITY_PAGES = [
  {
    slug: 'shower-partition-hyderabad',
    cityKey: 'hyderabad',
    cityName: 'Hyderabad',
    title:
      'Shower Glass Partition Hyderabad ₹440–1,320/sqft (2026) — Free Measurement | WoodenMax',
    h1: 'Shower Glass Partition Hyderabad — Price &amp; Installation (2026)',
    description:
      'Shower glass partition Hyderabad ₹440–1,320/sqft. Gachibowli, Banjara Hills, Jubilee Hills, Kukatpally. 3×5 ft ≈ ₹11,000–18,000. Free site visit, 1-day install.',
    areas: 'Gachibowli, Banjara Hills, Jubilee Hills, Kukatpally, Madhapur, Financial District &amp; surrounding GHMC',
    heroSub:
      'Shower glass partition supply &amp; install in Hyderabad — frameless walk-in, black profile sliding &amp; frosted options. Standard 3×5 ft shower ≈ ₹11,000–18,000. Free measurement, typical 1-day installation.',
  },
  {
    slug: 'shower-partition-delhi',
    cityKey: 'delhi',
    cityName: 'Delhi NCR',
    title:
      'Shower Glass Partition Delhi ₹440–1,320/sqft (2026) — Free Measurement | WoodenMax',
    h1: 'Shower Glass Partition Delhi NCR — Price &amp; Installation (2026)',
    description:
      'Shower glass partition Delhi NCR ₹440–1,320/sqft. Gurgaon, Noida, Dwarka, South Delhi. 3×5 ft ≈ ₹11,000–18,000. Free site visit, 1-day install.',
    areas: 'Gurgaon, Noida, Dwarka, Vasant Kunj, Greater Kailash, Saket &amp; wider NCR',
    heroSub:
      'Shower glass partition supply &amp; install across Delhi NCR — frameless walk-in, black profile sliding &amp; frosted options. Standard 3×5 ft shower ≈ ₹11,000–18,000. Free measurement, typical 1-day installation.',
  },
  {
    slug: 'shower-partition-bangalore',
    cityKey: 'bangalore',
    cityName: 'Bangalore',
    title:
      'Shower Glass Partition Bangalore ₹440–1,320/sqft (2026) — Free Measurement | WoodenMax',
    h1: 'Shower Glass Partition Bangalore — Price &amp; Installation (2026)',
    description:
      'Shower glass partition Bangalore ₹440–1,320/sqft. Whitefield, Koramangala, Indiranagar, HSR. 3×5 ft ≈ ₹11,000–18,000. Free site visit, 1-day install.',
    areas: 'Whitefield, Koramangala, Indiranagar, HSR Layout, Electronic City, Sarjapur &amp; BBMP zones',
    heroSub:
      'Shower glass partition supply &amp; install in Bangalore — frameless walk-in, black profile sliding &amp; frosted options. Standard 3×5 ft shower ≈ ₹11,000–18,000. Free measurement, typical 1-day installation.',
  },
];

function createCityPages() {
  for (const cfg of CITY_PAGES) {
    const out = path.join(SHOWER_DIR, `${cfg.slug}.html`);
    fs.writeFileSync(out, buildCityPage(cfg), 'utf8');
    console.log('  ✓ created', cfg.slug + '.html');
  }
}

function linkCitiesFromHub() {
  const hub = path.join(ROOT, 'products', 'shower-partitions.html');
  let html = fs.readFileSync(hub, 'utf8');
  const block = `<section class="cluster-section" id="shower-city-prices">
  <div class="container">
    <h2 class="cluster-h2">Shower partition price by city</h2>
    <p class="cluster-prose">Local ₹/sqft bands, free site measurement &amp; 1-day installation — tap your city:</p>
    <div class="catalog-hub-grid catalog-hub-grid--compact">
      <a href="./shower-partitions/shower-partition-hyderabad" class="catalog-hub-card"><div class="catalog-hub-card-body" style="padding:1rem;"><strong>Hyderabad</strong><span>₹440–1,320/sqft · free visit</span></div></a>
      <a href="./shower-partitions/shower-partition-delhi" class="catalog-hub-card"><div class="catalog-hub-card-body" style="padding:1rem;"><strong>Delhi NCR</strong><span>₹440–1,320/sqft · free visit</span></div></a>
      <a href="./shower-partitions/shower-partition-bangalore" class="catalog-hub-card"><div class="catalog-hub-card-body" style="padding:1rem;"><strong>Bangalore</strong><span>₹440–1,320/sqft · free visit</span></div></a>
    </div>
  </div>
</section>
`;
  if (!html.includes('id="shower-city-prices"')) {
    html = html.replace(
      '<section class="cluster-faq-section">',
      block + '\n<section class="cluster-faq-section">'
    );
    fs.writeFileSync(hub, html, 'utf8');
    console.log('  ✓ hub city links added');
  }
}

function updateSitemap() {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(sitemapPath, 'utf8');
  const entries = CITY_PAGES.map(
    (c) => `  <url>
    <loc>https://woodenmax.in/products/shower-partitions/${c.slug}</loc>
    <lastmod>2026-05-19</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>`
  ).join('\n');
  if (!xml.includes('shower-partition-hyderabad')) {
    xml = xml.replace(
      '  <url>\n    <loc>https://woodenmax.in/products/shower-partitions</loc>',
      entries + '\n  <url>\n    <loc>https://woodenmax.in/products/shower-partitions</loc>'
    );
    fs.writeFileSync(sitemapPath, xml, 'utf8');
    console.log('  ✓ sitemap.xml updated');
  }
}

console.log('Shower silo fixes…');
fixGlassPricePage();
fixFramelessPage();
addHubBackToAllGuides();
createCityPages();
linkCitiesFromHub();
updateSitemap();
console.log('Done.');
