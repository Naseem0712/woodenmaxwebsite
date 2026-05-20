/**
 * Generates 10 SEO "tool-style" aluminium window cluster pages.
 * Calculator HTML is sliced from live product pages so behaviour stays in sync.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'products', 'aluminium-windows');

function sliceLines(file, start1, end1) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  return lines.slice(start1 - 1, end1).join('\n');
}

function replaceCalcId(block, oldId, newId) {
  return block.split(oldId).join(newId);
}

function escAttr(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/** FAQ / schema: remove HTML, keep readable plain text for JSON-LD */
function stripForJsonLd(s) {
  if (!s) return '';
  return s
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function defaultPriceRange(calcKind) {
  if (calcKind === '3track') return { min: 400, max: 1000 };
  if (calcKind === 'casement') return { min: 500, max: 1200 };
  return { min: 500, max: 1400 };
}

/** Per-slug: long tail, product title for schema, optional price override, longer OG text */
const PAGE_SEO = {
  '2-track-aluminium-window-price': {
    longTail:
      '2 track aluminum window price per sqft, 29mm sliding window rate, aluminium window cost per square feet, balcony sliding window price India, sliding window with mesh cost comparison, aluminium window design modern',
    productName: '2 Track Premium Aluminium Sliding Window (29mm) — India Price & Calculator',
    priceMin: 1200,
    priceMax: 1400,
    ogDescription:
      '2 track aluminium sliding window price in India 2026: typical ₹1200–1400/sqft (29mm). Live size calculator, glass and hardware adders, 2 vs 3 vs 4 track comparison. Get quote — WoodenMax.',
  },
  '4-track-sliding-window-price': {
    longTail:
      '4 track sliding window price, multi track aluminium window cost, wide opening sliding window India, 4 track vs 2 track price, mesh sliding window cost per sqft, villa sliding door window estimate',
    productName: '4 Track & Multi-Track Aluminium Sliding Window — Price & Calculator (India)',
    priceMin: 650,
    priceMax: 1200,
    ogDescription:
      '4 track aluminium sliding window price guide 2026: multi-panel & wide openings, mesh options, live Domal-series calculator, when to use vs 2 track. Free estimate & WhatsApp size send — WoodenMax.',
  },
  'aluminium-casement-window-price': {
    longTail:
      'aluminium casement window price per sqft India, top hung window cost, openable window price bathroom kitchen, casement window with mesh price, outward opening window rate 2026',
    productName: 'Aluminium Casement (Top Hung) Window — Price, Calculator & Options India',
    priceMin: 750,
    priceMax: 1050,
    ogDescription:
      'Aluminium casement window price India 2026: ~₹750–1050/sqft with glass, mesh, multipoint. Live openable-window calculator, cost breakdown, sliding vs casement link — WoodenMax.',
  },
  'slim-aluminium-window-price-luxury': {
    longTail:
      'slim aluminium window price luxury, minimal profile window cost, narrow frame aluminium window India, modern elevation window price, premium casement slim line rate',
    productName: 'Slim & Luxury Aluminium Window — India Price, Calculator & Elevation Picks',
    priceMin: 900,
    priceMax: 1500,
    ogDescription:
      'Slim aluminium window price for luxury homes & facades: minimal sightlines, premium hardware, calculator-based range and breakdown vs standard profiles — WoodenMax India.',
  },
  'aluminium-window-price-per-sqft': {
    longTail:
      'aluminium window price per square feet India, alu window rate 2026, sliding window price per sqft, casement per sqft cost, how to calculate window cost with glass',
    productName: 'Aluminium Window Price Per Sqft — Main India Guide & Calculator 2026',
    priceMin: 550,
    priceMax: 1500,
    ogDescription:
      'Aluminium window price per sqft in India: compare Domal, premium sliding, casement, slim. Rate table + live calculator for instant total — city-wise quote on WhatsApp. WoodenMax.',
  },
  'aluminium-sliding-window-price-calculator': {
    longTail:
      'aluminium sliding window price calculator free, sliding window cost calculator online India, 29mm sliding estimate, window price calculator with glass, instant window budget tool',
    productName: 'Aluminium Sliding Window Price Calculator — Free Online (WoodenMax)',
    priceMin: 500,
    priceMax: 1400,
    ogDescription:
      'Free aluminium sliding window price calculator: enter width×height, glass, coating, mesh; get ₹ range in seconds. Send result on WhatsApp. Works pan-India — WoodenMax 2026.',
  },
  'sliding-vs-casement-window': {
    longTail:
      'sliding vs casement window which is better, sliding vs casement cost India, casement or sliding for balcony, ventilation comparison, maintenance sliding vs casement',
    productName: 'Sliding vs Casement Window — Comparison, Price & Calculator (India 2026)',
    priceMin: 500,
    priceMax: 1400,
    ogDescription:
      'Sliding vs casement window: cost, ventilation, maintenance, best rooms. Side-by-side table + embedded sliding calculator + link to casement tool. Decide faster — WoodenMax.',
  },
  'best-aluminium-window-for-home': {
    longTail:
      'best aluminium window for home India, which window is best for living room, bedroom window type, DGU for noise, safe window for ground floor, modern aluminium window design',
    productName: 'Best Aluminium Window for Home — Room-by-Room Picks + Calculator 2026',
    priceMin: 550,
    priceMax: 1500,
    ogDescription:
      'Best aluminium window for Indian homes: living, bedroom, kitchen, bath picks; price bands; live calculator to budget. Mix sliding + casement like pros — WoodenMax.',
  },
  'aluminium-window-price-hyderabad': {
    longTail:
      'aluminium window price in Hyderabad, Hyderabad sliding window cost per sqft, aluminium window rate Gachibowli Banjara, local window installation Hyderabad, city template India',
    productName: 'Aluminium Window Price in Hyderabad — ₹/sqft, Calculator & Site Visit',
    priceMin: 550,
    priceMax: 1400,
    ogDescription:
      'Aluminium window price in Hyderabad: typical ₹/sqft bands, installation notes, Gachibowli & villa examples. Live calculator + WhatsApp for exact quote — WoodenMax. (Template for other cities.)',
  },
  'aluminium-window-glass-price-breakdown': {
    longTail:
      'aluminium window glass price, DGU glass cost per sqft, laminated glass window price India, 6mm 8mm 12mm toughened price, aluminium window cost with glass breakdown',
    productName: 'Aluminium Window Glass Price — DGU, Laminated, Toughened Breakdown 2026',
    priceMin: 500,
    priceMax: 1400,
    ogDescription:
      'Aluminium window glass price breakdown: toughened, DGU, laminated, safety; how each changes ₹/sqft and total. Section diagrams + full-window calculator — WoodenMax India.',
  },
};

function mergeSeo(p) {
  const d = defaultPriceRange(p.calcKind);
  const s = PAGE_SEO[p.slug] || {};
  const ogDesc = s.ogDescription || p.description;
  const longTail = s.longTail
    ? `${p.keywords}, ${s.longTail}`
    : `${p.keywords}, aluminium window price India, sliding window cost calculator, 2026`;
  return {
    ...p,
    _ogDescription: ogDesc,
    _longTail: longTail,
    _productName: s.productName || p.breadcrumbLabel,
    _priceMin: typeof s.priceMin === 'number' ? s.priceMin : d.min,
    _priceMax: typeof s.priceMax === 'number' ? s.priceMax : d.max,
  };
}

function ensureMinFaqs(faqs) {
  const out = faqs.slice();
  const generic = {
    q: 'Does WoodenMax supply and install aluminium windows across India?',
    a: 'Yes. We work in Hyderabad, Delhi NCR, Bangalore, Mumbai, Pune, Jaipur, Lucknow, and more. Use the calculator on this page, then WhatsApp your sizes and city for a firm quote after site check.',
  };
  if (out.length < 4 && !out.some((f) => /across India|WoodenMax supply/i.test(f.q))) {
    out.push(generic);
  }
  return out;
}

const CALC_29MM = sliceLines(
  path.join(root, 'products', 'aluminium-windows', 'aluminium-sliding-window.html'),
  910,
  1103
);
const CALC_3TRACK = sliceLines(
  path.join(root, 'products', 'aluminium-windows', '3-track-sliding-window.html'),
  940,
  1123
);
const CALC_CASEMENT = sliceLines(
  path.join(root, 'products', 'aluminium-windows', 'top-hung-casement-window.html'),
  751,
  943
);

function calcHtml(kind, calcId) {
  if (kind === '29mm') return replaceCalcId(CALC_29MM, 'price-calculator-29mm-sliding', calcId);
  if (kind === '3track') return replaceCalcId(CALC_3TRACK, 'price-calculator-3track-sliding', calcId);
  if (kind === 'casement') return replaceCalcId(CALC_CASEMENT, 'price-calculator-top-hung-casement', calcId);
  throw new Error('Unknown calc kind: ' + kind);
}

function footerScripts(kind) {
  const ext =
    kind === '3track'
      ? '  <script src="../../js/calculator/extensions/3track-sliding.js" defer></script>\n'
      : kind === 'casement'
        ? '  <script src="../../js/calculator/extensions/top-hung-casement.js" defer></script>\n'
        : '';
  return `  <script src="../../js/main.js"></script>
  <script src="../../js/email-submitter.js"></script>
  <script src="../../js/calculator/configs.js" defer></script>
  <script src="../../js/calculator/base.js" defer></script>
${ext}  <script src="../../js/calculator/loader.js" defer></script>
  <script src="../../js/calculator/smooth-typing-indicator.js" defer></script>
  <script src="../../js/calculator/multiple-sizes-calculator.js" defer></script>
  <script src="../../js/mobile-collapsible-sections.js" defer></script>
  <script src="../../js/floating-calc-button.js" defer></script>`;
}

const WA_TEXT = encodeURIComponent(
  'Hi WoodenMax — I want an aluminium window quote. Width __ ft × Height __ ft. City: __. (2026 rates)'
);

const NAV = `  <nav class="navbar scrolled" id="navbar">
    <div class="container">
      <div class="navbar-content">
        <a href="../../index" class="navbar-logo">
          <div class="logo-icon"><img src="../../images/woodenmax-logo.webp" alt="WoodenMax Logo" ></div>
    </a>
    <div class="nav-menu">
      <a href="../../index" class="nav-link">Home</a>
      <div class="category-carousel-wrapper">
        <button class="carousel-nav prev" id="catPrev"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button>
        <div class="category-carousel" id="categoryCarousel">
          <a href="../aluminium-windows" class="cat-item active">Aluminium</a>
          <a href="../telescope-windows" class="cat-item">Telescope</a>
          <a href="../folding-systems" class="cat-item">Folding</a>
          <a href="../metal-louvers" class="cat-item">Louvers</a>
          <a href="../shower-partitions" class="cat-item">Shower</a>
          <a href="../elevation-cladding" class="cat-item">Elevation</a>
          <a href="../glass-elevation" class="cat-item">Glass</a>
          <a href="../glass-railing" class="cat-item">Railing</a>
          <a href="../grills" class="cat-item" data-index="8">Grills</a>
        </div>
        <button class="carousel-nav next" id="catNext"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button>
      </div>
      <a href="../../about" class="nav-link">About</a>
      <a href="../../contact.html" class="nav-link">Contact</a>
    </div>
    <div class="nav-cta"><a href="tel:+917895328080"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Call</a></div>
    <button class="mobile-toggle" id="mobileToggle" aria-label="Toggle Menu">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="menuIcon"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="closeIcon" style="display:none;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  </div>
</div>  </nav>

  <div class="mobile-menu" id="mobileMenu">
    <div class="mobile-menu-content">
      <a href="../../index" class="mobile-nav-item">Home</a>
      <div class="mobile-category-grid">
        <a href="../aluminium-windows" class="mobile-cat-item" style="background:rgba(245,158,11,0.2);border-color:var(--gold-500);"><span>Aluminium</span></a>
        <a href="../telescope-windows" class="mobile-cat-item"><span>Telescope</span></a>
        <a href="../folding-systems" class="mobile-cat-item"><span>Folding</span></a>
        <a href="../metal-louvers" class="mobile-cat-item"><span>Louvers</span></a>
        <a href="../shower-partitions" class="mobile-cat-item"><span>Shower</span></a>
        <a href="../elevation-cladding" class="mobile-cat-item"><span>Elevation</span></a>
        <a href="../glass-elevation" class="mobile-cat-item"><span>Glass</span></a>
        <a href="../glass-railing" class="mobile-cat-item"><span>Railing</span></a>
        <a href="../grills" class="mobile-cat-item"><span class="mobile-cat-icon">🔒</span><span>Grills</span></a>
      </div>
      <a href="../../about" class="mobile-nav-item">About Us</a>
      <a href="../../contact.html" class="mobile-nav-item">Contact Us</a>
      <div class="mobile-menu-footer">
        <a href="tel:+917895328080" class="cta-btn"> Call Now</a>
      </div>
    </div>
  </div>`;

function faqSchema(faqs) {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: stripForJsonLd(f.a) },
      })),
    },
    null,
    0
  );
}

function breadcrumbListItems(slug, name) {
  return [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://woodenmax.in/' },
    { '@type': 'ListItem', position: 2, name: 'Catalog', item: 'https://woodenmax.in/catalog' },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Aluminium Windows',
      item: 'https://woodenmax.in/products/aluminium-windows',
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: name,
      item: `https://woodenmax.in/products/aluminium-windows/${slug}`,
    },
  ];
}

function breadcrumbSchema(slug, name) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbListItems(slug, name),
  });
}

function productSchema(p, canonical, priceMin, priceMax) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p._productName,
    description: p.description,
    image: p.ogImage,
    sku: `WM-SEO-${p.slug.replace(/-/g, '').toUpperCase().slice(0, 24)}`,
    brand: { '@type': 'Brand', name: 'WoodenMax', url: 'https://woodenmax.in' },
    category: 'Aluminium Windows',
    manufacturer: { '@type': 'Organization', name: 'WoodenMax' },
    offers: {
      '@type': 'AggregateOffer',
      url: canonical,
      priceCurrency: 'INR',
      lowPrice: priceMin,
      highPrice: priceMax,
      offerCount: 1,
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2026-12-31',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        priceCurrency: 'INR',
        unitCode: 'SQFT',
        unitText: 'per square foot',
        minPrice: priceMin,
        maxPrice: priceMax,
      },
    },
  });
}

function webPageSchema(p, canonical) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: p.h1,
    description: p.description,
    inLanguage: 'en-IN',
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://woodenmax.in/#website',
      name: 'WoodenMax',
      url: 'https://woodenmax.in',
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: p.ogImage,
      width: 1200,
      height: 800,
      caption: p.ogImageAlt,
    },
    datePublished: '2026-04-25T00:00:00+05:30',
    dateModified: '2026-04-25T00:00:00+05:30',
  });
}

/** Safer inside &lt;script type="application/ld+json"&gt; */
function jsonld(s) {
  return s.replace(/</g, '\\u003c');
}

function serviceCalcSchema(p, canonical) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonical}#window-calculator-service`,
    name: `${p.breadcrumbLabel} — live price estimate`,
    description: stripForJsonLd(p.description),
    serviceType: 'Aluminium window price calculator',
    url: `${canonical}#window-price-calculator`,
    provider: {
      '@type': 'Organization',
      name: 'WoodenMax',
      url: 'https://woodenmax.in',
      telephone: '+91-78953-28080',
    },
    areaServed: { '@type': 'Country', name: 'India' },
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'INR',
      description: 'Online estimate; final rate after site measurement',
    },
  });
}

function breadcrumbNavMicrodata(slug, name) {
  const u = `https://woodenmax.in/products/aluminium-windows/${slug}`;
  return `<nav style="font-size: 0.875rem; color: #475569;" aria-label="Breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
      <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://woodenmax.in/" style="color: #475569; text-decoration: none;"><span itemprop="name">Home</span></a>
        <meta itemprop="position" content="1" />
      </span>
      <span style="margin: 0 0.35rem;">/</span>
      <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://woodenmax.in/catalog" style="color: #475569; text-decoration: none;"><span itemprop="name">Catalog</span></a>
        <meta itemprop="position" content="2" />
      </span>
      <span style="margin: 0 0.35rem;">/</span>
      <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a itemprop="item" href="https://woodenmax.in/products/aluminium-windows" style="color: #475569; text-decoration: none;"><span itemprop="name">Aluminium Windows</span></a>
        <meta itemprop="position" content="3" />
      </span>
      <span style="margin: 0 0.35rem;">/</span>
      <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <span itemprop="name" style="color: #1E40AF; font-weight: 600;">${escAttr(name)}</span>
        <meta itemprop="position" content="4" />
        <link itemprop="item" href="${u}" />
      </span>
    </nav>`;
}

function relatedSection(currentSlug) {
  const pool = [
    { href: '2-track-aluminium-window-price', label: '2 Track Aluminium Window Price' },
    { href: '4-track-sliding-window-price', label: '4 Track Sliding Window Price' },
    { href: 'aluminium-casement-window-price', label: 'Aluminium Casement Window Price' },
    { href: 'slim-aluminium-window-price-luxury', label: 'Slim Aluminium Window (Luxury)' },
    { href: 'aluminium-window-price-per-sqft', label: 'Aluminium Window Price Per Sqft' },
    { href: 'aluminium-sliding-window-price-calculator', label: 'Sliding Window Price Calculator' },
    { href: 'sliding-vs-casement-window', label: 'Sliding vs Casement' },
    { href: 'best-aluminium-window-for-home', label: 'Best Window for Home' },
    { href: 'aluminium-window-price-hyderabad', label: 'Hyderabad Window Price' },
    { href: 'aluminium-window-glass-price-breakdown', label: 'Glass Price Breakdown' },
    { href: 'aluminium-sliding-window', label: '29mm Sliding (product page)' },
    { href: '3-track-sliding-window', label: '3 Track Sliding' },
    { href: 'top-hung-casement-window', label: 'Top Hung Casement' },
  ];
  const picks = pool.filter((p) => p.href !== currentSlug).slice(0, 6);
  const lis = picks.map((p) => `            <li><a href="${p.href}">${p.label}</a></li>`).join('\n');
  return `
  <section class="related-windows" aria-labelledby="related-windows-heading" style="padding: 3rem 0; background: #0f172a; color: #e2e8f0;">
    <div class="container">
      <h2 id="related-windows-heading" style="margin: 0 0 1rem; color: #f8fafc;">Internal linking — window cluster &amp; tools</h2>
      <p style="color: #94a3b8; max-width: 860px; margin: 0 0 0.75rem; line-height: 1.65;"><strong>Hub:</strong> <a href="../aluminium-windows" style="color: #fbbf24;">Aluminium Windows</a> · <a href="../../aluminium-window-price-calculator" style="color: #fbbf24;">Main price calculator (site)</a> · <a href="../../blog" style="color: #fbbf24;">Window guides (blog)</a></p>
      <p style="color: #94a3b8; max-width: 860px; margin: 0 0 1.25rem; line-height: 1.65;"><strong>Other categories:</strong> <a href="../shower-partitions" style="color: #fbbf24;">Shower partitions</a> · <a href="../folding-systems" style="color: #fbbf24;">Folding systems</a> · <a href="../telescope-windows" style="color: #fbbf24;">Telescope windows</a> · <a href="../grills" style="color: #fbbf24;">Safety grills</a></p>
      <h3 style="color: #e2e8f0; font-size: 1rem; margin: 0 0 0.5rem;">Related cluster pages</h3>
      <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.9;">
${lis}
      </ul>
    </div>
  </section>`;
}

function extraInternalStrip(slug) {
  const x = (href, label) =>
    `<a href="${href}" style="color:#1d4ed8;font-weight:500;">${label}</a>`;
  const o = (h, l) => (slug === h ? '' : x(h, l));
  return `<aside style="padding:0 0 1.5rem;border-bottom:1px solid #e2e8f0;margin-bottom:1.5rem;" aria-label="On-page internal links">
      <p style="margin:0 0 0.5rem;font-size:0.9rem;color:#64748b;font-weight:600;">Explore next</p>
      <p style="margin:0;font-size:0.9rem;line-height:1.75;">
        ${o('aluminium-window-price-per-sqft', '₹/sqft guide')}
        <span style="color:#cbd5e1;"> · </span>
        ${o('sliding-vs-casement-window', 'Sliding vs casement')}
        <span style="color:#cbd5e1;"> · </span>
        ${o('aluminium-window-glass-price-breakdown', 'Glass cost')}
        <span style="color:#cbd5e1;"> · </span>
        <a href="../../aluminium-window-price-calculator" style="color:#1d4ed8;font-weight:500;">Free calculator (home)</a>
        <span style="color:#cbd5e1;"> · </span>
        <a href="../aluminium-windows" style="color:#1d4ed8;font-weight:500;">All aluminium windows</a>
      </p>
    </aside>`;
}

function footer() {
  return `
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-brand">
            <div class="footer-brand-icon"><img src="../../images/woodenmax-logo.webp" alt="WoodenMax Logo" ></div>
          </div>
          <p class="footer-description">Aluminium window price tools — WoodenMax India.</p>
        </div>
        <div>
          <h3 class="footer-title">Quick Links</h3>
          <ul class="footer-links">
            <li><a href="../../index">Home</a></li>
            <li><a href="../../catalog">Catalog</a></li>
            <li><a href="../aluminium-windows">Aluminium Windows Hub</a></li>
            <li><a href="../../contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-title">Products</h3>
          <ul class="footer-links">
            <li><a href="../shower-partitions">Shower partitions</a></li>
            <li><a href="../folding-systems">Folding systems</a></li>
            <li><a href="../glass-elevation">Glass elevation</a></li>
          </ul>
        </div>
        <div>
          <h3 class="footer-title">Contact</h3>
          <p style="color: #e0e0e0; font-size: 0.9rem;">+91 789-5328080</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 WoodenMax. All rights reserved.</p>
      </div>
    </div>
  </footer>`;
}

/** @type {Array<Record<string, any>>} */
const pages = [
  {
    file: '2-track-aluminium-window-price.html',
    slug: '2-track-aluminium-window-price',
    calcKind: '29mm',
    calcId: 'price-calculator-seo-2track',
    breadcrumbLabel: '2 Track Aluminium Window Price',
    title: '2 Track Aluminium Window Price ₹1200–1400/sqft (2026) + Calculator | WoodenMax',
    description:
      '2 track aluminium sliding window price India 2026. ₹/sqft range, live size calculator, glass & hardware breakdown. Compare tracks & get quote.',
    h1: '2 Track Aluminium Window Price ₹1200–1400/sqft (2026) + Live Size Calculator',
    keywords:
      '2 track sliding window price, aluminium window price, sliding window price per sqft, aluminium window cost india',
    ogImage:
      'https://woodenmax.in/images/products/2%20Track%20Aluminium%20Window/2-track-aluminium-sliding-window-modern-home.webp',
    ogImageAlt:
      '2 track aluminium sliding window design in a modern Indian home facade',
    gallery: [
      {
        src: '../../images/products/2 Track Aluminium Window/2-track-aluminium-sliding-window-modern-home.webp',
        alt: 'Aluminium sliding window design modern home with slim frame lines',
      },
      {
        src: '../../images/products/2 Track Aluminium Window/budget-aluminium-window-2-track-design.webp',
        alt: '2 track aluminium window price India reference photo budget friendly layout',
      },
      {
        src: '../../images/products/2 Track Aluminium Window/2-track-window-frame-glass-detail.webp',
        alt: 'Sliding window frame and glass detail showing interlock and gasket line',
      },
    ],
    faqs: [
      {
        q: 'What is the 2 track aluminium window price per sqft in India in 2026?',
        a: 'Premium 29mm series 2 track aluminium sliding windows typically fall between ₹1200 and ₹1400 per sq.ft installed, before GST, depending on glass upgrades, coating, mesh, and hardware. Budget 27mm Domal systems can start lower — see our 3 track page for Domal-style pricing.',
      },
      {
        q: 'Is a 2 track window cheaper than a 3 track or 4 track sliding window?',
        a: 'More tracks usually mean more aluminium, hardware, and machining — so multi-track systems often cost more per opening. 2 track is efficient for simple glass + glass sliding. 3–4 track adds mesh or extra panels for wider spans.',
      },
      {
        q: 'How do I get an exact 2 track window price for my sizes?',
        a: 'Use the live calculator on this page with your width × height, then send the same sizes on WhatsApp or request a site visit for final measurements and sealing details.',
      },
    ],
    priceSection: `<p style="color:#334155;line-height:1.8;">Most homeowners searching <strong>2 track aluminium window price</strong> want a simple sliding opening with two panels on parallel tracks. On this page the range reflects our <strong>29mm premium sliding series</strong> (not 27mm Domal). For balcony packages with mesh track, also review <a href="3-track-sliding-window">3 track sliding window</a> and <a href="4-track-sliding-window-price">4 track sliding price guide</a>.</p>
      <div style="overflow-x:auto;margin-top:1rem;"><table style="width:100%;border-collapse:collapse;font-size:0.95rem;background:#fff;border:1px solid #e2e8f0;"><thead><tr style="background:#1e3a5f;color:#fff;"><th style="padding:0.65rem;text-align:left;">Configuration</th><th style="padding:0.65rem;text-align:left;">Indicative ₹/sqft</th></tr></thead><tbody>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">29mm 2 track — 6mm glass, standard hardware</td><td style="padding:0.65rem;">₹1200 – ₹1280</td></tr>
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:0.65rem;">29mm 2 track — DGU / safety glass upgrade</td><td style="padding:0.65rem;">₹1320 – ₹1400+</td></tr>
      </tbody></table></div>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>2 track is usually two glass panels. 3 track adds a mesh or third panel path. 4 track supports wider openings with more panels — expect higher <strong>aluminium window cost with glass</strong> because of extra profiles and rollers.</p>
      <h3>Sliding vs casement</h3><p>Sliding saves space inside; casement swings for maximum vent areas in kitchens and baths. See <a href="sliding-vs-casement-window">sliding vs casement comparison</a>.</p>
      <h3>Slim vs standard</h3><p>Slim sightlines cost more per kg of profile and need precise glass specs. Standard 29mm series balances price and durability.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Hindalco or imported 6063 T6 profiles, powder coating, and reinforcement for wind load.</p>
      <h3>Glass cost</h3><p>6mm toughened is typical; DGU and laminated add ₹/sqft for acoustic and thermal goals.</p>
      <h3>Hardware cost</h3><p>Locks, rollers, and end caps — multi-point upgrades add per-window charges.</p>
      <h3>Installation cost</h3><p>Façade level, silicone, fasteners, and labour — final quote after site check.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>27mm Domal 3-track systems often beat premium 29mm 2-track on ₹/sqft but differ on glass stack and hardware feel.</p>
      <h3>Which is better for home?</h3><p>Living and balcony: sliding. Bathrooms and utility: casement or top-hung.</p>
      <h3>Maintenance</h3><p>Clean tracks quarterly; casement hinges need lubrication less often than roller paths.</p>`,
    useCasesSection: `<ul style="line-height:1.9;color:#334155;"><li><strong>Apartment living rooms:</strong> 2 track sliding for noise and view.</li><li><strong>Offices:</strong> DGU for HVAC efficiency.</li><li><strong>Villas:</strong> combine with <a href="full-elevation-villa-facade">elevation systems</a>.</li></ul>`,
  },
  {
    file: '4-track-sliding-window-price.html',
    slug: '4-track-sliding-window-price',
    calcKind: '3track',
    calcId: 'price-calculator-seo-4track',
    breadcrumbLabel: '4 Track Sliding Window Price',
    title: '4 Track Aluminium Sliding Window Price ₹650–1200/sqft (2026) | Calculator',
    description:
      '4 track aluminium sliding window price guide India. Multi-panel sliding cost, mesh options, live Domal-series calculator — upgrade path to premium 29mm.',
    h1: '4 Track Aluminium Sliding Window Price ₹650–1200/sqft (2026) + Calculator',
    keywords:
      '4 track sliding window price, multi track aluminium window, sliding window price per sqft, aluminium window cost india',
    ogImage:
      'https://woodenmax.in/images/products/4%20Track%20Sliding%20Window/4-track-aluminium-sliding-window-wide-opening.webp',
    ogImageAlt: 'Wide opening 4 track aluminium sliding window in living room',
    gallery: [
      {
        src: '../../images/products/4 Track Sliding Window/4-track-aluminium-sliding-window-wide-opening.webp',
        alt: '4 track aluminium sliding window wide opening for villa living room',
      },
      {
        src: '../../images/products/4 Track Sliding Window/4-track-window-design-living-room.webp',
        alt: 'Multi track aluminium window system natural light living room design',
      },
      {
        src: '../../images/products/4 Track Sliding Window/multi-track-aluminium-window-system.webp',
        alt: 'Aluminium window installation site view multi track sliding panels',
      },
    ],
    faqs: [
      {
        q: 'What is 4 track aluminium sliding window price per sqft?',
        a: 'Very wide multi-track sliders combine several panels and heavy-duty hardware. Budget Domal-style stacks often land roughly between ₹650 and ₹950 per sq.ft depending on glass and mesh, while premium sections can approach ₹1200+ per sq.ft. Exact numbers need sizes — use the calculator and add panel count in your WhatsApp message.',
      },
      {
        q: 'Is the calculator on this page accurate for 4 track?',
        a: 'The embedded tool follows our 27mm Domal 2/3 track logic — use it for baseline budgeting. For true 4-track bespoke headers, our team confirms steel inserts, reinforcement, and roller load after drawings.',
      },
      {
        q: 'When should I choose 4 track instead of 2 track?',
        a: 'Choose 4 track when you need very wide openings with multiple sliding glass panels, sometimes paired with mesh or fixed lites. 2 track stays ideal for standard balcony widths.',
      },
    ],
    priceSection: `<p>Four-track (multi-panel) sliders maximise clear opening on luxury villas and large living room spans. Pair this guide with <a href="2-track-aluminium-window-price">2 track price</a> and <a href="aluminium-sliding-window">premium 29mm product page</a>.</p>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>Tracks define how many parallel runners exist — more tracks mean more panels and fabrication time.</p><h3>Sliding vs casement</h3><p>Large vistas: sliding. Tight ventilator walls: casement.</p><h3>Slim vs standard</h3><p>Slim profiles raise material cost; standard Domal is cost-effective.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Extra tracks + couplers increase aluminium weight.</p><h3>Glass cost</h3><p>Wider units may need thicker toughened or stiffer DGU.</p><h3>Hardware cost</h3><p>Heavy-duty rollers and tandem setups.</p><h3>Installation cost</h3><p>Crane or scaffold adds for oversized lifts.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>Narrow 2 track is usually lowest ₹/sqft for the same glass.</p><h3>Which is better for home?</h3><p>Villa great-room: multi-track; bedrooms: 2 or 3 track.</p><h3>Maintenance</h3><p>More rollers = more periodic alignment checks.</p>`,
    useCasesSection: `<ul style="line-height:1.9;"><li>Sea-view villas</li><li>Hotel suites</li><li>Large office cabins</li></ul>`,
  },
  {
    file: 'aluminium-casement-window-price.html',
    slug: 'aluminium-casement-window-price',
    calcKind: 'casement',
    calcId: 'price-calculator-seo-casement-price',
    breadcrumbLabel: 'Aluminium Casement Window Price',
    title: 'Aluminium Casement Window Price ₹750–1050/sqft (2026) + Calculator | WoodenMax',
    description:
      'Aluminium casement window price India — outward opening, mesh & multipoint options. Live calculator, cost breakdown, vs sliding comparison.',
    h1: 'Aluminium Casement Window Price ₹750–1050/sqft (2026) + Openable Window Calculator',
    keywords: 'casement window price, aluminium casement window, aluminium window price, aluminium window cost india',
    ogImage: 'https://woodenmax.in/images/products/Casement%20Window/modern-casement-window-home.webp',
    ogImageAlt: 'Aluminium casement window open style on contemporary home elevation',
    gallery: [
      {
        src: '../../images/products/Casement Window/modern-casement-window-home.webp',
        alt: 'Modern casement window home elevation with aluminium frame',
      },
      {
        src: '../../images/products/Casement Window/aluminium-casement-window-open-style.webp',
        alt: 'Aluminium casement window open style outward ventilation detail',
      },
      {
        src: '../../images/products/Casement Window/casement-window-side-hinged-design.webp',
        alt: 'Casement window side hinged design for kitchen service opening',
      },
    ],
    faqs: [
      {
        q: 'What is aluminium casement window price per sqft?',
        a: 'Our top-hung outward opening casement series commonly prices between ₹750 and ₹1050 per sq.ft depending on mesh, grills, glass upgrades, and multipoint hardware.',
      },
      {
        q: 'Casement vs sliding — which costs more?',
        a: 'For similar glass, casement hardware (friction stay, multipoint) can match or exceed simple sliding rollers. Use both calculators to compare for your sizes.',
      },
      {
        q: 'Can I add mesh to casement windows?',
        a: 'Yes — inside openable mesh is popular for insect protection without losing the outward vent pattern.',
      },
    ],
    priceSection: `<p>Casement windows excel at sealing and directed ventilation. Official technical page: <a href="top-hung-casement-window">top hung casement window</a>.</p>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>Those track counts apply to sliding systems; casement uses hinges and stays instead.</p><h3>Sliding vs casement</h3><p>See <a href="sliding-vs-casement-window">full comparison</a>.</p><h3>Slim vs standard</h3><p>Slim casement profiles maximise glass but need tighter tolerances.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>40mm casement profiles with gaskets.</p><h3>Glass cost</h3><p>6–12mm toughened, DGU, laminated tiers.</p><h3>Hardware cost</h3><p>Friction stay + multipoint when glass is heavy.</p><h3>Installation cost</h3><p>Packers, alignment, and wet sealing.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>Budget sliding Domal can undercut casement; premium sliding aligns closer.</p><h3>Which is better for home?</h3><p>Wet areas & ventilators: casement; balconies: sliding.</p><h3>Maintenance</h3><p>Hinges: annual check; sliding: track cleaning.</p>`,
    useCasesSection: `<ul><li>Bathrooms</li><li>Kitchen service windows</li><li>Staircase ventilators</li></ul>`,
  },
  {
    file: 'slim-aluminium-window-price-luxury.html',
    slug: 'slim-aluminium-window-price-luxury',
    calcKind: 'casement',
    calcId: 'price-calculator-seo-slim-luxury',
    breadcrumbLabel: 'Slim Aluminium Window Price (Luxury)',
    title: 'Slim Aluminium Window Price ₹900–1500/sqft (2026) Luxury Series | WoodenMax',
    description:
      'Slim aluminium window price for luxury homes & villas. Minimal sightlines, premium coatings, calculator-based estimate and cost breakdown.',
    h1: 'Slim Aluminium Window Price ₹900–1500/sqft (2026) — Luxury Minimal Profiles',
    keywords: 'slim window cost, slim aluminium window, luxury aluminium window, aluminium window design modern',
    ogImage: 'https://woodenmax.in/images/products/slim%20aluminium%20window/slim-aluminium-window-luxury-villa.webp',
    ogImageAlt: 'Slim aluminium window luxury villa design with large glass panels',
    gallery: [
      {
        src: '../../images/products/slim aluminium window/slim-aluminium-window-luxury-villa.webp',
        alt: 'Slim aluminium window luxury villa design with panoramic glass',
      },
      {
        src: '../../images/products/slim aluminium window/minimal-slim-window-frame-design.webp',
        alt: 'Minimal slim window frame design for modern elevation',
      },
      {
        src: '../../images/products/slim aluminium window/slim-profile-window-modern-elevation.webp',
        alt: 'Slim profile window on modern elevation aluminium fins',
      },
    ],
    faqs: [
      {
        q: 'Why do slim aluminium windows cost more?',
        a: 'Thinner profiles need higher grade aluminium, precise machining, and often imported hardware to carry the same glass weight safely.',
      },
      {
        q: 'Are slim windows only for casement?',
        a: 'Most luxury slim lines are casement or fixed-lite combinations, but slim sliding is also available for select series — share drawings for validation.',
      },
      {
        q: 'Do you supply slim windows in Hyderabad and Delhi?',
        a: 'Yes — we fabricate and install across major Indian cities; coastal projects may need upgraded coating specs.',
      },
    ],
    priceSection: `<p>Luxury slim lines target maximum glass and minimum visible frame. Also see product page <a href="slimline-aluminium-window">slimline aluminium window</a>.</p>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>Luxury packages may pair fixed slim lites with a sliding door — hybrid pricing.</p><h3>Sliding vs casement</h3><p>Slim casement is common for European-style vents.</p><h3>Slim vs standard</h3><p>Slim = thinner face width; standard = higher economy.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Premium billet and coating brands.</p><h3>Glass cost</h3><p>Oversized DGU common.</p><h3>Hardware cost</h3><p>Imported hinges and minimalist handles.</p><h3>Installation cost</h3><p>Laser alignment & protection during stone work.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>Standard casement wins on ₹/sqft.</p><h3>Which is better for home?</h3><p>Design-forward villas choose slim.</p><h3>Maintenance</h3><p>Similar to casement; check hinge screws after monsoon.</p>`,
    useCasesSection: `<ul><li>Luxury villas</li><li>Architect-led facades</li><li>Penthouse corners</li></ul>`,
  },
  {
    file: 'aluminium-window-price-per-sqft.html',
    slug: 'aluminium-window-price-per-sqft',
    calcKind: '29mm',
    calcId: 'price-calculator-seo-per-sqft',
    breadcrumbLabel: 'Aluminium Window Price Per Sqft',
    title: 'Aluminium Window Price Per Sqft India (2026) | Main Guide + Calculator',
    description:
      'Aluminium window price per square feet India — sliding, casement, slim ranges, comparison table, and live calculator for instant estimates.',
    h1: 'Aluminium Window Price Per Sqft India (2026) + Instant Estimator',
    keywords:
      'aluminium window price per square feet india, aluminium window price, sliding window price per sqft',
    ogImage: 'https://woodenmax.in/images/products/Window%20Price%20Per%20Sqft/sliding-window-price-range-india.webp',
    ogImageAlt: 'Sliding window price range India chart style illustration',
    gallery: [
      {
        src: '../../images/products/Window Price Per Sqft/sliding-window-price-range-india.webp',
        alt: 'Sliding window price per sqft range reference for Indian cities',
      },
      {
        src: '../../images/products/Window Price Per Sqft/aluminium-window-price-comparison-chart.webp',
        alt: 'Aluminium window price comparison chart by window type',
      },
    ],
    faqs: [
      {
        q: 'What is the average aluminium window price per sqft?',
        a: 'In 2026, budget Domal sliding can start near ₹550–750/sqft while premium 29mm sliding often lands ₹1200–1400/sqft. Casement commonly ₹750–1050/sqft. Glass tier moves these bands sharply.',
      },
      {
        q: 'Is installation included in per sqft rates?',
        a: 'Marketing ranges usually include typical installation, but complex anchors, stone patching, or high-rise access may be extra — disclose site conditions when you request quote.',
      },
      {
        q: 'How do I convert sqft rate to project budget?',
        a: 'Multiply width × height in feet for each opening, sum sqft, then multiply by the rate band, or use the calculator for line-item totals.',
      },
    ],
    priceSection: `<p>This is the <strong>main per sqft hub</strong> for the cluster. Use the calculator (premium 29mm sliding logic) and cross-check other styles via the related links.</p>
      <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;font-size:0.92rem;"><thead><tr style="background:#0f172a;color:#fff;"><th style="padding:0.6rem;">System</th><th style="padding:0.6rem;">Typical ₹/sqft</th></tr></thead><tbody>
      <tr><td style="padding:0.6rem;border-bottom:1px solid #e2e8f0;">27mm Domal sliding (mesh capable)</td><td style="padding:0.6rem;">₹550 – ₹950</td></tr>
      <tr><td style="padding:0.6rem;border-bottom:1px solid #e2e8f0;">29mm premium 2 track sliding</td><td style="padding:0.6rem;">₹1200 – ₹1400</td></tr>
      <tr><td style="padding:0.6rem;border-bottom:1px solid #e2e8f0;">Top hung casement</td><td style="padding:0.6rem;">₹750 – ₹1050</td></tr>
      <tr><td style="padding:0.6rem;">Slim luxury line</td><td style="padding:0.6rem;">₹900 – ₹1500+</td></tr>
      </tbody></table></div>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>More tracks → more aluminium and hardware.</p><h3>Sliding vs casement</h3><p>Operational difference drives hardware cost.</p><h3>Slim vs standard</h3><p>Slim raises profile and glass engineering cost.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Series + coating + colour.</p><h3>Glass cost</h3><p>Largest variable — see <a href="aluminium-window-glass-price-breakdown">glass breakdown</a>.</p><h3>Hardware cost</h3><p>Locks, rollers, multipoint.</p><h3>Installation cost</h3><p>Site dependent.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>Domal sliding < premium sliding < slim luxury (general rule).</p><h3>Which is better for home?</h3><p>Mix: sliding living, casement wet areas.</p><h3>Maintenance</h3><p>Tracks vs hinges — both low if installed well.</p>`,
    useCasesSection: `<ul><li>First budget pass</li><li>Architect BOQ checks</li><li>Finance approvals</li></ul>`,
  },
  {
    file: 'aluminium-sliding-window-price-calculator.html',
    slug: 'aluminium-sliding-window-price-calculator',
    calcKind: '29mm',
    calcId: 'price-calculator-seo-sliding-calc',
    breadcrumbLabel: 'Aluminium Sliding Window Price Calculator',
    title: 'Aluminium Sliding Window Price Calculator (2026) Free | WoodenMax',
    description:
      'Free aluminium sliding window price calculator. Enter sizes, glass, coating, mesh — get ₹ range instantly. Send output on WhatsApp for validation.',
    h1: 'Aluminium Sliding Window Price Calculator (2026) — Free Instant ₹ Estimate',
    keywords: 'aluminium sliding window price calculator, sliding window calculator, aluminium window calculator',
    ogImage: 'https://woodenmax.in/images/products/Window%20Calculator%20Page/aluminium-window-size-calculator-tool.webp',
    ogImageAlt: 'Aluminium window size calculator tool interface concept',
    gallery: [
      {
        src: '../../images/products/Window Calculator Page/aluminium-window-size-calculator-tool.webp',
        alt: 'Aluminium window size calculator tool for sliding window cost online',
      },
      {
        src: '../../images/products/Window Calculator Page/calculate-sliding-window-cost-online.webp',
        alt: 'Calculate sliding window cost online with WoodenMax estimator',
      },
    ],
    faqs: [
      {
        q: 'Is this sliding window calculator free?',
        a: 'Yes — it runs in your browser using the same logic family as our premium 29mm sliding product calculator.',
      },
      {
        q: 'Can I calculate multiple windows?',
        a: 'Use Add Another Size for each opening; totals aggregate at the bottom.',
      },
      {
        q: 'What if I need Domal 27mm pricing?',
        a: 'Switch to <a href="3-track-sliding-window">3 track sliding window</a> calculator for Domal-series options.',
      },
    ],
    priceSection: `<p>Tool-first page: scroll to the calculator, export your numbers, then <strong>Send Size on WhatsApp</strong>. Full generic calculator: <a href="../../aluminium-window-price-calculator">aluminium window price calculator</a>.</p>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>Calculator here = premium 2 track sliding stack.</p><h3>Sliding vs casement</h3><p>Open <a href="aluminium-casement-window-price">casement price</a> in a second tab.</p><h3>Slim vs standard</h3><p>Slim lines need manual review — share PDF.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Captured in base ₹/sqft curve.</p><h3>Glass cost</h3><p>Selected from dropdown deltas.</p><h3>Hardware cost</h3><p>Lock upgrade lines.</p><h3>Installation cost</h3><p>Included in typical band — outliers quoted separately.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>Domal vs premium — compare both calculators.</p><h3>Which is better for home?</h3><p>Balcony sliders win for clear opening.</p><h3>Maintenance</h3><p>Vacuum tracks, check drain holes.</p>`,
    useCasesSection: `<ul><li>Renovation budgeting</li><li>Contractor bidding</li><li>Quick developer estimates</li></ul>`,
  },
  {
    file: 'sliding-vs-casement-window.html',
    slug: 'sliding-vs-casement-window',
    calcKind: '29mm',
    calcId: 'price-calculator-seo-slide-vs-case',
    breadcrumbLabel: 'Sliding vs Casement Window',
    title: 'Sliding vs Casement Window (2026) — Price, Ventilation & Calculator | WoodenMax',
    description:
      'Sliding vs casement window — which is better for Indian homes? Compare cost, maintenance, ventilation, noise. Includes sliding calculator + links to casement tool.',
    h1: 'Sliding vs Casement Window (2026) — Comparison + Sliding Calculator',
    keywords: 'sliding vs casement window which is better, casement window price, sliding window price per sqft',
    ogImage: 'https://woodenmax.in/images/products/Sliding%20vs%20Casement/sliding-vs-casement-window-comparison.webp',
    ogImageAlt: 'Sliding vs casement window comparison side by side diagram',
    gallery: [
      {
        src: '../../images/products/Sliding vs Casement/sliding-vs-casement-window-comparison.webp',
        alt: 'Sliding vs casement window comparison graphic for Indian apartments',
      },
      {
        src: '../../images/products/Sliding vs Casement/casement-and-sliding-window-side-by-side.webp',
        alt: 'Casement and sliding window side by side on sample elevation',
      },
    ],
    faqs: [
      {
        q: 'Sliding vs casement — which is cheaper in India?',
        a: 'Budget Domal sliding can be among the lowest ₹/sqft options. Premium sliding aligns closer to casement. Compare both calculators with the same glass spec.',
      },
      {
        q: 'Which is better for balcony?',
        a: 'Sliding is most common for balconies because it does not swing into furniture. Casement can work if external space is clear.',
      },
      {
        q: 'Which seals better in heavy rain?',
        a: 'Quality casement with multi-point compression can seal extremely well. Sliding relies on brushes and drainage — both work when detailed correctly.',
      },
    ],
    priceSection: `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #cbd5e1;font-size:0.9rem;"><thead><tr style="background:#1e293b;color:#fff;"><th style="padding:0.65rem;">Topic</th><th style="padding:0.65rem;">Sliding</th><th style="padding:0.65rem;">Casement</th></tr></thead><tbody>
      <tr><td style="padding:0.65rem;">Interior space</td><td style="padding:0.65rem;">No swing — great indoors</td><td style="padding:0.65rem;">Needs swing clearance</td></tr>
      <tr><td style="padding:0.65rem;">Vent pattern</td><td style="padding:0.65rem;">50% typical vent</td><td style="padding:0.65rem;">Full sash can direct air</td></tr>
      <tr><td style="padding:0.65rem;">Calculator</td><td style="padding:0.65rem;">Below (29mm sliding)</td><td style="padding:0.65rem;"><a href="aluminium-casement-window-price">Casement tool</a></td></tr>
      </tbody></table></div>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>Sliding-only taxonomy.</p><h3>Sliding vs casement</h3><p>You are on the master comparison for operations.</p><h3>Slim vs standard</h3><p>Both styles offer slim variants — casement more common.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Sliding needs tracks; casement needs hinges.</p><h3>Glass cost</h3><p>Same glass can serve both if sizes match.</p><h3>Hardware cost</h3><p>Roller sets vs friction stays.</p><h3>Installation cost</h3><p>Similar labour hours for standard sizes.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>Depends on series — use numbers not guesses.</p><h3>Which is better for home?</h3><p>Balcony sliding; service casement.</p><h3>Maintenance</h3><p>Tracks vs hinges — both easy.</p>`,
    useCasesSection: `<ul><li>Apartment retrofits</li><li>Villa master planning</li><li>PM–vendor alignment</li></ul>`,
  },
  {
    file: 'best-aluminium-window-for-home.html',
    slug: 'best-aluminium-window-for-home',
    calcKind: '29mm',
    calcId: 'price-calculator-seo-best-home',
    breadcrumbLabel: 'Best Aluminium Window for Home',
    title: 'Best Aluminium Window for Home (2026) — Picks by Room + Calculator',
    description:
      'Best aluminium window for home in India — room-by-room picks, price bands, and calculator to budget sliding upgrades before you buy.',
    h1: 'Best Aluminium Window for Home (2026) + Room-by-Room Picks & Calculator',
    keywords: 'best aluminium window for home, aluminium window design modern, aluminium window price',
    ogImage: 'https://woodenmax.in/images/products/Best%20Window%20for%20Home/living-room-window-design-aluminium.webp',
    ogImageAlt: 'Living room window design aluminium sliding system modern interior',
    gallery: [
      {
        src: '../../images/products/Best Window for Home/living-room-window-design-aluminium.webp',
        alt: 'Living room window design aluminium minimal frame modern home',
      },
      {
        src: '../../images/products/Best Window for Home/window-cost-per-sqft-visual-guide.webp',
        alt: 'Window cost per sqft visual guide for homeowners comparing options',
      },
    ],
    faqs: [
      {
        q: 'Which aluminium window is best for living room?',
        a: 'Premium 29mm sliding or slim combinations for views; add DGU if you face traffic noise.',
      },
      {
        q: 'Which window is best for Indian kitchens?',
        a: 'Top-hung casement or sliding with easy-clean tracks — casement helps vent smoke if external space allows.',
      },
      {
        q: 'What about safety?',
        a: 'Pair ground-floor sliders with grills or laminated glass; casement multipoint helps security.',
      },
    ],
    priceSection: `<p>Practical picks: <strong>living/balcony</strong> → sliding; <strong>bath/kitchen</strong> → casement; <strong>luxury facade</strong> → slim profiles. Explore <a href="sliding-vs-casement-window">sliding vs casement</a>.</p>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>Add mesh = plan 3 track early.</p><h3>Sliding vs casement</h3><p>Mix both in same flat.</p><h3>Slim vs standard</h3><p>Budget vs design drama.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Room-specific sizes drive total more than type.</p><h3>Glass cost</h3><p>DGU for bedrooms facing roads.</p><h3>Hardware cost</h3><p>Upgrade locks on ground floor.</p><h3>Installation cost</h3><p>Monsoon-ready sealing.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>Domal sliding for rental ROI; premium for self-use.</p><h3>Which is better for home?</h3><p>Hybrid strategy wins.</p><h3>Maintenance</h3><p>Annual inspection before monsoon.</p>`,
    useCasesSection: `<ul><li>First-time homeowners</li><li>Joint family upgrades</li><li>WFH quiet rooms</li></ul>`,
  },
  {
    file: 'aluminium-window-price-hyderabad.html',
    slug: 'aluminium-window-price-hyderabad',
    calcKind: '29mm',
    calcId: 'price-calculator-seo-hyd',
    breadcrumbLabel: 'Aluminium Window Price in Hyderabad',
    title: 'Aluminium Window Price in Hyderabad (2026) ₹/sqft + Calculator | WoodenMax',
    description:
      'Aluminium window price in Hyderabad — local intent guide, typical ₹/sqft bands, installation notes, and live calculator. Template you can copy for other cities.',
    h1: 'Aluminium Window Price in Hyderabad (2026) + Instant Calculator',
    keywords: 'aluminium window price Hyderabad, aluminium window cost india, sliding window price per sqft',
    ogImage: 'https://woodenmax.in/images/products/City%20Price%20Page/window-project-site-installation.webp',
    ogImageAlt: 'Aluminium window installation site Hyderabad region project photo',
    gallery: [
      {
        src: '../../images/products/City Price Page/best-aluminium-window-for-home-design.webp',
        alt: 'Best aluminium window for home design Hyderabad modern apartment',
      },
      {
        src: '../../images/products/City Price Page/window-project-site-installation.webp',
        alt: 'Aluminium window installation site crew sealing frame',
      },
    ],
    faqs: [
      {
        q: 'What is aluminium window price per sqft in Hyderabad?',
        a: 'Expect similar national bands: Domal sliding near ₹550–950/sqft, premium 29mm sliding ₹1200–1400/sqft, casement ₹750–1050/sqft — subject to site access and coating choice.',
      },
      {
        q: 'Do you visit site in Hyderabad?',
        a: 'Yes — book via WhatsApp or contact form with approximate sizes and pincode.',
      },
      {
        q: 'Can I use this page for other cities?',
        a: 'Duplicate the template: swap city name, local landmarks, and link from your city hub pages.',
      },
    ],
    priceSection: `<p><strong>Local intent capture:</strong> Hyderabad projects often mix <em>premium living room sliders</em> with <em>casement wet areas</em>. Use calculator, mention community name in WhatsApp for faster routing.</p><p>Also see <a href="../../city/hyderabad">Hyderabad city hub</a>.</p>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>Gated community balconies: 2–3 track popular.</p><h3>Sliding vs casement</h3><p>High-rise: check external swing rules for casement.</p><h3>Slim vs standard</h3><p>Financial district premium apartments → slim demand.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Coastal-adjacent humidity → powder quality matters.</p><h3>Glass cost</h3><p>DGU helps ORR traffic noise.</p><h3>Hardware cost</h3><p>Multi-point for tower wind pressure.</p><h3>Installation cost</h3><p>High-rise cradle access if applicable.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>Domal for investment rentals in peripheral zones.</p><h3>Which is better for home?</h3><p>West-facing DGU combos common.</p><h3>Maintenance</h3><p>Dusty summers — track cleaning quarterly.</p>`,
    useCasesSection: `<ul><li>Gachibowli IT flats</li><li>Banjara Hills villas</li><li>Outskirt plotted homes</li></ul>`,
  },
  {
    file: 'aluminium-window-glass-price-breakdown.html',
    slug: 'aluminium-window-glass-price-breakdown',
    calcKind: '29mm',
    calcId: 'price-calculator-seo-glass',
    breadcrumbLabel: 'Aluminium Window Glass Price Breakdown',
    title: 'Aluminium Window Glass Price Breakdown (2026) DGU, Laminated, Toughened | WoodenMax',
    description:
      'Aluminium window glass price breakdown — how toughened, DGU, laminated, and safety glass change ₹/sqft. Diagrams + calculator to see total window cost.',
    h1: 'Aluminium Window Glass Price Breakdown (2026) + Total Cost Calculator',
    keywords: 'aluminium window cost with glass, aluminium window glass price, dgu glass window price',
    ogImage: 'https://woodenmax.in/images/products/Glass%20Price%20Breakdown/double-glass-dgu-window-section.webp',
    ogImageAlt: 'Double glass DGU aluminium window section view diagram',
    gallery: [
      {
        src: '../../images/products/Glass Price Breakdown/double-glass-dgu-window-section.webp',
        alt: 'Double glass aluminium window section view with DGU air gap',
      },
      {
        src: '../../images/products/Glass Price Breakdown/aluminium-window-glass-types.webp',
        alt: 'Aluminium window glass types comparison toughened laminated DGU',
      },
    ],
    faqs: [
      {
        q: 'How much does DGU glass add versus 6mm toughened?',
        a: 'DGU upgrades air gap insulation and usually adds a higher ₹/sqft delta than single toughened — exact adders appear in the calculator dropdown for premium sliding.',
      },
      {
        q: 'When is laminated glass worth it?',
        a: 'Safety, security, and acoustic goals — especially ground floor or nursery rooms.',
      },
      {
        q: 'Does thicker glass need stronger hardware?',
        a: 'Often yes — sash weight rises; multipoint or heavy-duty rollers may be required.',
      },
    ],
    priceSection: `<p>Glass is the fastest mover in <strong>aluminium window cost with glass</strong>. The calculator below shows how upgrades stack on the frame band.</p>`,
    typesSection: `<h3>2 track vs 3 track vs 4 track</h3><p>Does not change glass physics — but wider units need thicker lites.</p><h3>Sliding vs casement</h3><p>Casement may limit max glass weight per sash.</p><h3>Slim vs standard</h3><p>Slim frames may cap glass thickness — engineer review.</p>`,
    breakdownSection: `<h3>Frame cost</h3><p>Fixed for a given series.</p><h3>Glass cost</h3><p>Toughened tiers, DGU, laminated, low-e upgrades.</p><h3>Hardware cost</h3><p>Auto upgrades at certain glass weights.</p><h3>Installation cost</h3><p>Heavy lifts = slightly more labour.</p>`,
    compareSection: `<h3>Which is cheaper?</h3><p>6mm single cheapest; DGU mid; acoustic laminates premium.</p><h3>Which is better for home?</h3><p>Bedrooms facing roads → DGU or laminated.</p><h3>Maintenance</h3><p>Clean DGU spacers gently — no harsh acids.</p>`,
    useCasesSection: `<ul><li>NCAP-facing homes</li><li>Studio pods</li><li>Hospital-adjacent sites</li></ul>`,
  },
];

function renderPage(raw) {
  const p = mergeSeo(raw);
  const faqs = ensureMinFaqs(p.faqs);
  const canonical = `https://woodenmax.in/products/aluminium-windows/${p.slug}`;
  const calcBlock = calcHtml(p.calcKind, p.calcId);
  const kwMeta = p._longTail.length > 450 ? p._longTail.slice(0, 447) + '...' : p._longTail;
  const aiIntent =
    `${p.h1} | ${p._longTail.replace(/,\s*/g, ' · ').slice(0, 300)} | WoodenMax India calculator`;

  const galleryHtml = p.gallery
    .map(
      (g, i) => `        <figure style="margin:0;">
          <img class="alum-seo-hero-compact" src="${g.src}" alt="${g.alt.replace(/"/g, '&quot;')}" width="720" height="480" ${i === 0 ? 'fetchpriority="high" loading="eager" decoding="async"' : 'loading="lazy" decoding="async"'} style="width:100%;max-width:300px;height:auto;border-radius:10px;border:1px solid #e2e8f0;margin:0 auto;display:block;">
        </figure>`
    )
    .join('\n');

  const firstImg = p.gallery[0] ? p.gallery[0].src : '';
  const preloadImg = firstImg
    ? `  <link rel="preload" as="image" href="${firstImg}" />\n`
    : '';
  const pm = p._priceMin;
  const px = p._priceMax;

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
  <script defer src="../../js/analytics.js"></script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escAttr(p.title)}</title>
  <meta name="description" content="${escAttr(p.description)}" />
  <meta name="keywords" content="${escAttr(kwMeta)}" />
  <meta name="author" content="WoodenMax" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${canonical}" />
  <link rel="image_src" href="${p.ogImage}" />
  <meta name="image" content="${p.ogImage}" />
  <meta property="article:published_time" content="2026-04-25T00:00:00+05:30" />
  <meta property="article:modified_time" content="2026-04-25T00:00:00+05:30" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escAttr(p.title)}" />
  <meta property="og:description" content="${escAttr(p._ogDescription)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:site_name" content="WoodenMax" />
  <meta property="og:image" content="${p.ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="800" />
  <meta property="og:image:alt" content="${escAttr(p.ogImageAlt)}" />
  <meta property="og:locale" content="en_IN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(p.title)}" />
  <meta name="twitter:description" content="${escAttr(p._ogDescription)}" />
  <meta name="twitter:image" content="${p.ogImage}" />
  <meta name="twitter:image:alt" content="${escAttr(p.ogImageAlt)}" />
  <meta name="twitter:site" content="@woodenmax" />
  <meta name="ai:intent" content="${escAttr(aiIntent)}" />
  <meta name="ai:tool" content="${escAttr(p._productName)}" />
  <meta name="ai:tool:type" content="Aluminium window price guide + live area calculator" />
  <meta name="ai:tool:features" content="Multi-size input, glass and hardware options, real-time price range, per-sqft context, comparison tables, FAQ, internal links to product pages" />
  <meta name="ai:tool:products" content="Aluminium sliding windows, casement windows, multi-track windows, DGU and safety glass" />
  <meta name="ai:tool:input" content="Width, height, units, glass type, coating, lock/mesh where applicable, city for quote" />
  <meta name="ai:tool:output" content="Estimated total in INR, per-sqft context, next-step WhatsApp and contact" />
  <meta name="ai:tool:useCase" content="Home construction, renovation, BOQ, architect and contractor pricing" />
  <meta name="ai:tool:audience" content="Homeowners, architects, interior designers, builders, fabricators" />
  <meta name="ai:tool:url" content="${canonical}" />
  <link rel="icon" type="image/x-icon" href="../../favicon.ico" />
  <link rel="icon" type="image/png" href="../../favicon.png" sizes="32x32" />
  <link rel="apple-touch-icon" href="../../favicon.png" />
${preloadImg}  <link rel="stylesheet" href="../../css/styles.css" />
  <link rel="stylesheet" href="../../css/calculator-global.css" />
  <link rel="stylesheet" href="../../css/product-pages-global.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${jsonld(productSchema(p, canonical, pm, px))}</script>
  <script type="application/ld+json">${jsonld(webPageSchema(p, canonical))}</script>
  <script type="application/ld+json">${jsonld(serviceCalcSchema(p, canonical))}</script>
  <script type="application/ld+json">${jsonld(faqSchema(faqs))}</script>
  <script type="application/ld+json">${jsonld(breadcrumbSchema(p.slug, p.breadcrumbLabel))}</script>
  <script type="application/ld+json">${jsonld('{"@context":"https://schema.org","@type":"Organization","@id":"https://woodenmax.in/#org","name":"WoodenMax","url":"https://woodenmax.in","logo":"https://woodenmax.in/images/woodenmax-logo.webp","telephone":"+91-78953-28080"}')}</script>
</head>
<body class="morning-seo-page">
${NAV}

  <div style="padding: 6rem 0 1rem; background: #F3F4F6;">
    <div class="container">
      ${breadcrumbNavMicrodata(p.slug, p.breadcrumbLabel)}
    </div>
  </div>

  <section class="product-detail-hero">
    <div class="container">
      <span class="section-label">Aluminium windows · price tools &amp; guides</span>
      <h1 style="font-family:'Playfair Display',serif;font-size:2.25rem;color:#0f172a;margin:0.5rem 0;">${p.h1}</h1>
      <p style="color:#475569;max-width:820px;line-height:1.7;">${p.description}</p>
      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin:1.25rem 0;">
        <a href="#${p.calcId}" class="btn btn-primary">Calculate Your Window Cost</a>
        <a href="https://wa.me/917895328080?text=${WA_TEXT}" class="btn btn-outline" rel="noopener" target="_blank">Send Size on WhatsApp</a>
        <a href="../../contact.html?product=${p.slug}" class="btn btn-outline">Get Exact Price</a>
      </div>
      ${extraInternalStrip(p.slug)}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;margin-top:1.5rem;">
${galleryHtml}
      </div>
    </div>
  </section>

  <section style="padding:3rem 0;background:#fff;" id="aluminium-window-price-range">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">Aluminium Window Price (Short Intro + Range)</h2>
      ${p.priceSection}
    </div>
  </section>

  <section style="padding:3rem 0;background:#f8fafc;" id="window-price-calculator">
    <div class="container">
      <h2 class="section-title">Price Calculator (Interactive Section)</h2>
      <p style="color:#475569;max-width:720px;">Use live sizes — GST and site-specific extras are confirmed after inspection.</p>
      ${calcBlock}
    </div>
  </section>

  <section style="padding:3rem 0;background:#fff;" id="types-design-options">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">Types &amp; Design Options</h2>
      ${p.typesSection}
    </div>
  </section>

  <section style="padding:3rem 0;background:#f1f5f9;" id="price-breakdown">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">Price Breakdown (Material, Glass, Size)</h2>
      ${p.breakdownSection}
    </div>
  </section>

  <section style="padding:3rem 0;background:#fff;" id="comparison">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">Comparison (vs Other Options)</h2>
      ${p.compareSection}
    </div>
  </section>

  <section style="padding:3rem 0;background:#0f172a;color:#e2e8f0;" id="best-use-cases">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title" style="color:#f8fafc;">Best Use Cases (Home / Office / Villa)</h2>
      ${p.useCasesSection}
    </div>
  </section>

  <section style="padding:3rem 0;background:#fff;" id="faqs">
    <div class="container" style="max-width:900px;">
      <h2 class="section-title">FAQs</h2>
      ${faqs
        .map(
          (f) => `<div style="margin-bottom:1.25rem;padding:1rem 1.25rem;border:1px solid #e2e8f0;border-radius:10px;">
        <h3 style="margin:0 0 0.5rem;font-size:1.05rem;color:#1e3a8a;">${f.q}</h3>
        <p style="margin:0;color:#334155;line-height:1.7;">${f.a}</p>
      </div>`
        )
        .join('\n')}
      <p style="margin-top:1.5rem;"><a href="../aluminium-windows" style="color:#1d4ed8;font-weight:600;">← Back to Aluminium Windows hub</a> · <a href="../shower-partitions" style="color:#1d4ed8;font-weight:600;">Shower partitions (other category)</a></p>
    </div>
  </section>

${relatedSection(p.slug)}
${footer()}

  <a href="#${p.calcId}" class="floating-calc-button" aria-label="Scroll to calculator">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
      <rect width="16" height="20" x="4" y="2" rx="2"/><path d="M8 6h8"/><path d="M16 14v4"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/>
    </svg>
    <span class="floating-calc-button-text">Calculator</span>
  </a>
${footerScripts(p.calcKind)}
</body>
</html>
`;
}

for (const p of pages) {
  fs.writeFileSync(path.join(outDir, p.file), renderPage(p), 'utf8');
  console.log('Wrote', p.file);
}

console.log('Done. Remember sitemap + ALL_URLS + hub links.');
