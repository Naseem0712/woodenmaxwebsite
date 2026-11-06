/**
 * Fix E — Calculator SEO unify (signals only; NO URL/slug changes).
 *
 * PRIMARY (GSC): /aluminium-window-price-calculator
 *   GSC: 8 clicks / 251 impr / 3.19% CTR / pos 4.8
 *   vs sliding product calc: 2 / 19 / 10.53% / 6.68
 *   vs hub /calculators: 20 / 526 — hub of ALL calcs (not aluminium-head owner)
 *
 * Roles:
 * 1. aluminium-window-price-calculator → PRIMARY “aluminium window price calculator”
 * 2. /calculators → hub of all WoodenMax calculators
 * 3. …/aluminium-sliding-window-price-calculator → sliding-specific tool
 * 4. glass-elevation-price-calculator → glass elevation / curtain wall (already distinct)
 *
 * Zero A–D ownership steal. Soft rates. No FREE CTAs in SERP assets. No fake AggregateRating.
 */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

function once(html, label, a, b, log) {
  if (!html.includes(a)) {
    log.push('MISS ' + label);
    return html;
  }
  log.push('OK ' + label);
  return html.replace(a, b);
}
function all(html, label, a, b, log) {
  const n = html.split(a).length - 1;
  if (!n) {
    log.push('MISS ALL ' + label);
    return html;
  }
  log.push('OK ALL ' + label + ' ×' + n);
  return html.split(a).join(b);
}
function stripKeywords(html, log) {
  const re = /\s*<meta name="keywords"[^>]*>\s*/i;
  if (re.test(html)) {
    log.push('OK remove keywords');
    return html.replace(re, '\n');
  }
  log.push('SKIP keywords (absent)');
  return html;
}
function stripAggregateRatingBlocks(html, log) {
  // Remove aggregateRating objects inside JSON-LD (non-greedy, nested-safe enough for flat objects)
  const re =
    /,\s*"aggregateRating"\s*:\s*\{\s*"@type"\s*:\s*"AggregateRating"\s*,\s*"ratingValue"\s*:\s*[^}]+\}/g;
  const n = (html.match(re) || []).length;
  if (n) {
    log.push('OK strip AggregateRating ×' + n);
    return html.replace(re, '');
  }
  // multiline variant
  const re2 =
    /,?\s*"aggregateRating"\s*:\s*\{[^}]*"@type"\s*:\s*"AggregateRating"[^}]*\}/gs;
  const n2 = (html.match(re2) || []).length;
  if (n2) {
    log.push('OK strip AggregateRating multiline ×' + n2);
    return html.replace(re2, '');
  }
  log.push('SKIP AggregateRating (absent or atypical)');
  return html;
}

function polishPrimary() {
  const file = path.join(root, 'aluminium-window-price-calculator.html');
  let html = fs.readFileSync(file, 'utf8');
  const log = [];
  const TITLE = 'Aluminium Window Price Calculator (2026) | Soft Size Estimate | WoodenMax';
  const H1 = 'Aluminium Window Price Calculator';
  const DESC =
    'Aluminium window price calculator for sliding, casement and French styles. Enter size, glass and finish for a soft planning estimate. Soft bands from live rates — WoodenMax India.';
  const OG_DESC =
    'Primary aluminium window price calculator — sliding, casement and French. Soft size-based planning estimate from WoodenMax live rates. GST extra.';

  html = once(html, 'title', '<title>Aluminium Window Price Calculator 2026 - Free | WoodenMax</title>', `<title>${TITLE}</title>`, log);
  html = once(
    html,
    'meta desc',
    '<meta name="description" content="Free aluminium window price calculator. Get instant cost estimate in 30 seconds. Sliding, casement, French door. No registration. 2026 updated rates." />',
    `<meta name="description" content="${DESC}" />`,
    log
  );
  html = stripKeywords(html, log);
  html = all(
    html,
    'og/twitter title Free',
    'content="Aluminium Window Price Calculator 2026 - Free | WoodenMax"',
    `content="${TITLE}"`,
    log
  );
  html = once(
    html,
    'og:description',
    '<meta property="og:description" content="FREE aluminium window price calculator - Get instant price estimates in 30 seconds. Calculate sliding & casement window costs. No registration required. Used by 12,500+ homeowners. 15+ years experience. Works for Hyderabad, Delhi, Bangalore, Pune & all Indian cities. Calculate now →" />',
    `<meta property="og:description" content="${OG_DESC}" />`,
    log
  );
  html = once(
    html,
    'twitter:description',
    '<meta name="twitter:description" content="FREE aluminium window calculator - Get instant price estimates in 30 seconds. No registration. Used by 12,500+ homeowners. 15+ years experience. Works for all Indian cities. Calculate now →" />',
    `<meta name="twitter:description" content="${OG_DESC}" />`,
    log
  );
  html = all(
    html,
    'og/twitter image alt FREE',
    'FREE Aluminium Window Price Calculator 2026 - Instant Quotes in 30 Seconds | WoodenMax',
    'Aluminium Window Price Calculator — soft size estimate | WoodenMax',
    log
  );
  html = all(
    html,
    'img alt FREE short',
    'FREE Aluminium Window Price Calculator 2026 - Instant Quotes | WoodenMax',
    'Aluminium Window Price Calculator — soft size estimate | WoodenMax',
    log
  );

  html = once(
    html,
    'Service.name',
    '"name": "Aluminium Window Price Calculator - Pricing Estimator"',
    '"name": "Aluminium Window Price Calculator"',
    log
  );
  html = once(
    html,
    'Service.desc Free',
    '"description": "Free online pricing estimator tool for aluminium windows. Calculate sliding window, casement window costs instantly based on size, glass type, and profile selection."',
    `"description": "${DESC}"`,
    log
  );
  html = once(
    html,
    'SoftwareApplication.desc',
    '"description": "Free online calculator to estimate aluminium window prices. Calculate sliding window, casement window costs instantly based on size, glass type, and profile selection."',
    `"description": "${DESC}"`,
    log
  );
  html = once(
    html,
    'softwareHelp Free',
    '"text": "Free online aluminium window price calculator. Enter dimensions, select glass type and profile, get instant price estimates with wastage calculation."',
    '"text": "Aluminium window price calculator. Enter dimensions, select glass type and profile for a soft planning estimate with wastage logic."',
    log
  );
  html = once(
    html,
    'WebPage.name Free',
    '"name": "Aluminium Window Price Calculator India | Free Online Calculator"',
    `"name": "${TITLE}"`,
    log
  );
  html = once(
    html,
    'WebPage.desc Free',
    '"description": "Free aluminium window price calculator. Calculate sliding window, casement window prices instantly. Enter size, select glass type, get instant quote."',
    `"description": "${DESC}"`,
    log
  );
  html = stripAggregateRatingBlocks(html, log);

  // H1 stays (already correct primary intent) — reinforce intro ownership + internal links
  html = once(
    html,
    'hero intro',
    'A real India-specific calculator — it builds the cost size by size, picks the right profile and hardware for your opening, and factors in fabrication wastage, so the number matches an actual fabricator quote rather than a generic per-sqft rate. Designed for homeowners, builders, architects, planners and purchase departments who need a trustworthy itemised estimate.',
    'This is WoodenMax’s primary aluminium window price calculator for sliding, casement and French styles. Enter size, glass and finish for a soft planning estimate (GST extra). For sliding-only sizes, use the <a href="/products/aluminium-windows/aluminium-sliding-window-price-calculator" style="color: var(--gold-400); text-decoration: underline;">sliding window price calculator</a>. Browse every tool on the <a href="/calculators" style="color: var(--gold-400); text-decoration: underline;">calculators hub</a>.',
    log
  );
  html = once(
    html,
    'how-to free lead',
    'Our free aluminium window price calculator helps you estimate costs for sliding windows, casement windows, and other aluminium window types instantly.',
    'This aluminium window price calculator helps you plan soft costs for sliding, casement and other aluminium window types.',
    log
  );
  html = once(
    html,
    'benefit no registration free',
    'No Registration: Use calculator completely free, no sign-up required',
    'No account needed: Run the calculator without signing up',
    log
  );
  html = once(
    html,
    'related hub Free label',
    'View all calculators: <a href="/calculators" style="color: var(--gold-400); text-decoration: underline;">Free Price Calculators Hub</a>',
    'View all calculators: <a href="/calculators" style="color: var(--gold-400); text-decoration: underline;">Building Material Calculators Hub</a>',
    log
  );
  // Soft link to A–D primaries without stealing their titles
  html = once(
    html,
    'related products list expand',
    'Browse products: <a href="/products/aluminium-windows" style="color: var(--gold-400); text-decoration: underline;">Aluminium Windows Collection</a>',
    'Browse products: <a href="/products/aluminium-windows" style="color: var(--gold-400); text-decoration: underline;">Aluminium Windows Collection</a> · <a href="/products/aluminium-windows/aluminium-sliding-window" style="color: var(--gold-400); text-decoration: underline;">2-track sliding product</a> · <a href="/products/aluminium-windows/3-track-sliding-window" style="color: var(--gold-400); text-decoration: underline;">3-track with mesh</a> · <a href="/products/aluminium-windows/domal-window-price" style="color: var(--gold-400); text-decoration: underline;">Domal price</a>',
    log
  );
  html = all(html, 'img alt Free Online', 'Aluminium Window Price Calculator - Free Online Calculator', 'Aluminium Window Price Calculator — soft size estimate', log);
  html = all(html, 'FAQ warranty free phrase', 'Warranty is completely free -', 'Warranty is included -', log);

  fs.writeFileSync(file, html);
  console.log('\n=== PRIMARY aluminium-window-price-calculator ===');
  log.forEach((l) => console.log(l));
}

function polishHub() {
  const file = path.join(root, 'calculators.html');
  let html = fs.readFileSync(file, 'utf8');
  const log = [];
  const TITLE = 'Building Material Price Calculators | Windows, Glass Elevation & More | WoodenMax';
  const H1 = 'Building Material Price Calculators';
  const DESC =
    'Hub of WoodenMax price calculators — aluminium windows, glass elevation, ACP/HPL, louvers, railings and more. Soft planning estimates from live rates. Pick a tool by material.';
  const OG_DESC =
    'All WoodenMax calculators in one hub. Aluminium windows, glass elevation, cladding, louvers and railings — soft size-based planning estimates.';

  html = once(
    html,
    'title',
    '<title>FREE Price Calculators 2026 | Aluminium Windows, Glass Elevation & More | WoodenMax</title>',
    `<title>${TITLE}</title>`,
    log
  );
  html = once(
    html,
    'meta desc',
    '<meta name="description" content="FREE online price calculators for building materials. Calculate prices for Aluminium Windows, Glass Elevation, HPL Cladding, ACP Sheets & more. Get instant quotes in 30 seconds. No registration required. Used by 12,500+ homeowners. Calculate now →" />',
    `<meta name="description" content="${DESC}" />`,
    log
  );
  html = stripKeywords(html, log);
  html = once(
    html,
    'og:title',
    '<meta property="og:title" content="FREE Price Calculators 2026 | Aluminium Windows, Glass Elevation & More | WoodenMax" />',
    `<meta property="og:title" content="${TITLE}" />`,
    log
  );
  html = once(
    html,
    'og:description',
    '<meta property="og:description" content="FREE online price calculators for building materials. Get instant quotes in 30 seconds. No registration required. Used by 12,500+ homeowners. 15+ years experience. Calculate now →" />',
    `<meta property="og:description" content="${OG_DESC}" />`,
    log
  );
  html = once(
    html,
    'twitter:title',
    '<meta name="twitter:title" content="FREE Price Calculators 2026 | WoodenMax" />',
    `<meta name="twitter:title" content="${TITLE}" />`,
    log
  );
  html = once(
    html,
    'twitter:description',
    '<meta name="twitter:description" content="FREE online price calculators for building materials. Get instant quotes in 30 seconds. No registration. 15+ years experience. Calculate now →" />',
    `<meta name="twitter:description" content="${OG_DESC}" />`,
    log
  );
  html = all(
    html,
    'og/twitter image alt FREE',
    'FREE Aluminium Window Price Calculator 2026 - Instant Quotes in 30 Seconds | WoodenMax',
    'WoodenMax building material price calculators hub',
    log
  );
  html = all(
    html,
    'img alt FREE short',
    'FREE Aluminium Window Price Calculator 2026 - Instant Quotes | WoodenMax',
    'WoodenMax building material price calculators hub',
    log
  );

  html = once(
    html,
    'ItemList.name Free',
    '"name": "Free Price Calculators - Pricing Estimator Tools Collection"',
    '"name": "Building Material Price Calculators"',
    log
  );
  html = once(
    html,
    'ItemList.desc Free',
    '"description": "Collection of free online pricing estimator tools for building materials. Calculate prices for windows, facades, and elevation materials instantly."',
    `"description": "${DESC}"`,
    log
  );
  html = all(
    html,
    'Collection/WebPage name Free',
    '"name": "Free Price Calculators - Building Materials"',
    `"name": "${H1}"`,
    log
  );
  html = once(
    html,
    'Collection.desc Free',
    '"description": "Collection of free online price calculators for windows, facades, and elevation materials. Get instant price estimates for all building materials."',
    `"description": "${DESC}"`,
    log
  );
  html = once(
    html,
    'WebPage.desc short Free',
    '"description": "Collection of free online price calculators for windows, facades, and elevation materials"',
    `"description": "${DESC}"`,
    log
  );
  html = stripAggregateRatingBlocks(html, log);

  html = once(html, 'H1', '<h1>Free Price Calculators</h1>', `<h1>${H1}</h1>`, log);
  html = once(
    html,
    'hero intro',
    'These are India-specific cost tools built for real projects — they size-out every window, door and elevation piece, add the right hardware, and include wastage so the number you see is what a fabricator would actually bill. Useful for homeowners, builders, architects, planners and purchase teams who need a proper itemised estimate, not a generic per-sqft guess.',
    'This hub lists every WoodenMax soft-estimate calculator — windows, glass elevation, cladding, louvers and railings. For the main aluminium window price tool, open the <a href="/aluminium-window-price-calculator" style="color: var(--gold-400, #d4b170); text-decoration: underline;">aluminium window price calculator</a>. Sliding-only sizes: <a href="/products/aluminium-windows/aluminium-sliding-window-price-calculator" style="color: var(--gold-400, #d4b170); text-decoration: underline;">sliding window price calculator</a>.',
    log
  );
  html = once(html, 'why Free Forever h4', '<h4>Free Forever</h4>', '<h4>No Account Needed</h4>', log);
  html = once(
    html,
    'why Free Forever body',
    'All calculators are completely free. No hidden charges, no subscriptions.',
    'Run any calculator without signing up. Soft estimates only — final quote after measurement.',
    log
  );
  html = once(
    html,
    'why lead free',
    'Our free calculators help you get accurate price estimates instantly, saving time and helping you plan your budget better.',
    'These calculators help you plan soft price bands quickly so you can compare options before a site quote.',
    log
  );
  html = once(
    html,
    'compare section free',
    'Compare different window types, calculate costs for your project, and get accurate estimates in seconds. All calculators are free and require no registration.',
    'Compare window types and materials, then open the matching calculator for a soft size-based estimate. No account required.',
    log
  );
  html = once(
    html,
    'try free online',
    'Use our free online calculators to get instant price estimates. Enter your dimensions, select specifications, and calculate costs for any window, door, or cladding type in seconds.',
    'Open a calculator below, enter dimensions and specifications, and get a soft planning estimate for windows, doors or cladding.',
    log
  );
  html = once(
    html,
    'instant no registration',
    'Get accurate price estimates for your specific location. All calculators work across India - Hyderabad, Delhi, Mumbai, Bangalore, Pune, Jaipur, and more. No registration required.',
    'Soft estimates work across India — Hyderabad, Delhi, Mumbai, Bangalore, Pune, Jaipur and more. Final rates confirmed after site measurement.',
    log
  );
  html = once(
    html,
    'instant results no reg',
    'Get price estimates in 30 seconds. No waiting, no registration required.',
    'Get a soft planning estimate in seconds. No account required.',
    log
  );

  fs.writeFileSync(file, html);
  console.log('\n=== HUB calculators ===');
  log.forEach((l) => console.log(l));
}

function polishSlidingCalc() {
  const file = path.join(
    root,
    'products',
    'aluminium-windows',
    'aluminium-sliding-window-price-calculator.html'
  );
  let html = fs.readFileSync(file, 'utf8');
  const log = [];
  const TITLE = 'Aluminium Sliding Window Price Calculator | Size & Soft ₹ Band | WoodenMax';
  const H1 = 'Aluminium Sliding Window Price Calculator';
  const DESC =
    'Sliding window price calculator — enter width × height, glass, coating and mesh for a soft ₹ planning band. For all aluminium window types use the primary calculator. WoodenMax India.';
  const OG_DESC =
    'Sliding-specific price calculator (size, glass, mesh). Soft ₹ band from live rates. Primary multi-type tool: aluminium window price calculator.';

  // Title may already be without Free — handle both
  if (html.includes('<title>Aluminium Sliding Window Price Calculator (2026) Free | WoodenMax</title>')) {
    html = once(
      html,
      'title Free',
      '<title>Aluminium Sliding Window Price Calculator (2026) Free | WoodenMax</title>',
      `<title>${TITLE}</title>`,
      log
    );
  } else {
    html = once(
      html,
      'title',
      '<title>Aluminium Sliding Window Price Calculator (2026) | WoodenMax</title>',
      `<title>${TITLE}</title>`,
      log
    );
  }

  html = once(
    html,
    'meta desc',
    '<meta name="description" content="Free aluminium sliding window price calculator. Enter sizes, glass, coating, mesh — get ₹ range instantly. Send output on WhatsApp for validation." />',
    `<meta name="description" content="${DESC}" />`,
    log
  );
  html = stripKeywords(html, log);

  html = all(
    html,
    'og/twitter title Free variants',
    'content="Aluminium Sliding Window Price Calculator (2026) Free | WoodenMax"',
    `content="${TITLE}"`,
    log
  );
  html = all(
    html,
    'og/twitter title plain',
    'content="Aluminium Sliding Window Price Calculator (2026) | WoodenMax"',
    `content="${TITLE}"`,
    log
  );
  html = once(
    html,
    'og:description',
    '<meta property="og:description" content="Free aluminium sliding window price calculator: enter width×height, glass, coating, mesh; get ₹ range in seconds. Send result on WhatsApp. Works pan-India — WoodenMax 2026." />',
    `<meta property="og:description" content="${OG_DESC}" />`,
    log
  );
  html = once(
    html,
    'twitter:description',
    '<meta name="twitter:description" content="Free aluminium sliding window price calculator: enter width×height, glass, coating, mesh; get ₹ range in seconds. Send result on WhatsApp. Works pan-India — WoodenMax 2026." />',
    `<meta name="twitter:description" content="${OG_DESC}" />`,
    log
  );

  // Product / WebPage names
  html = all(
    html,
    'Product.name Free Online',
    '"name":"Aluminium Sliding Window Price Calculator — Free Online (WoodenMax)"',
    `"name":"${H1}"`,
    log
  );
  html = all(
    html,
    'WebPage.name Free Instant',
    '"name": "Aluminium Sliding Window Price Calculator (2026) — Free Instant ₹ Estimate"',
    `"name": "${H1}"`,
    log
  );
  html = all(
    html,
    'Product.desc Free',
    '"description":"Free aluminium sliding window price calculator. Enter sizes, glass, coating, mesh — get ₹ range instantly. Send output on WhatsApp for validation."',
    `"description":"${DESC}"`,
    log
  );
  html = all(
    html,
    'Service.desc Free',
    '"description":"Free aluminium sliding window price calculator. Enter sizes, glass, coating, mesh — get ₹ range instantly. Send output on WhatsApp for validation."',
    `"description":"${DESC}"`,
    log
  );
  html = stripAggregateRatingBlocks(html, log);

  // H1 variants
  html = once(
    html,
    'H1 seo-page',
    '<h1 class="seo-page-h1">Aluminium Sliding Window Price Calculator — Free Instant ₹ Estimate (2026)</h1>',
    `<h1 class="seo-page-h1">${H1}</h1>`,
    log
  );
  html = once(
    html,
    'H1 inline style',
    '<h1 style="font-family: \'Playfair Display\', serif; font-size: 2.5rem; margin: 0 0 0.5rem; color: #0F172A;">Aluminium Sliding Window Price Calculator (2026)</h1>',
    `<h1 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 0 0 0.5rem; color: #0F172A;">${H1}</h1>`,
    log
  );

  html = all(
    html,
    'Free estimate chip',
    'No hidden cost • Free estimate • Price based on your size • GST extra',
    'No hidden cost • Planning estimate • Price based on your size • GST extra',
    log
  );
  html = all(html, 'Free estimate phrase', 'Free estimate', 'Planning estimate', log);

  // Soft ownership note after H1
  if (!html.includes('data-fix-e-sliding-role')) {
    const h1Needle = `<h1 class="seo-page-h1">${H1}</h1>`;
    if (html.includes(h1Needle)) {
      html = html.replace(
        h1Needle,
        `${h1Needle}\n          <p data-fix-e-sliding-role style="margin:0.5rem 0 0;color:#475569;font-size:0.98rem;line-height:1.55;">Sliding-window sizes only. For every aluminium window type, use the <a href="/aluminium-window-price-calculator">aluminium window price calculator</a>. Product gallery: <a href="/products/aluminium-windows/aluminium-sliding-window">2-track sliding window</a> · mesh: <a href="/products/aluminium-windows/3-track-sliding-window">3-track with mesh</a>.</p>`
      );
      log.push('OK inject sliding role blurb');
    } else {
      log.push('MISS inject sliding role blurb');
    }
  }

  // Soften FAQ "Is this sliding window calculator free?"
  html = all(
    html,
    'FAQ free Q',
    '"name": "Is this sliding window calculator free?"',
    '"name": "Do I need an account to use this sliding window calculator?"',
    log
  );
  html = all(
    html,
    'FAQ free Q visible',
    'Is this sliding window calculator free?',
    'Do I need an account to use this sliding window calculator?',
    log
  );

  fs.writeFileSync(file, html);
  console.log('\n=== SLIDING aluminium-sliding-window-price-calculator ===');
  log.forEach((l) => console.log(l));
}

function polishGlassElevation() {
  const file = path.join(root, 'glass-elevation-price-calculator.html');
  let html = fs.readFileSync(file, 'utf8');
  const log = [];
  const TITLE = 'Glass Elevation Price Calculator | Curtain Wall Soft Estimate | WoodenMax';
  const H1 = 'Glass Elevation Price Calculator';
  const DESC =
    'Glass elevation price calculator for curtain wall and structural glazing. Soft planning estimate by area, glass and frame — not an aluminium window calculator. WoodenMax India.';
  const OG_DESC =
    'Curtain wall / structural glazing soft estimate. Distinct from the aluminium window price calculator. Live rates — WoodenMax.';

  html = once(
    html,
    'title',
    '<title>Glass Elevation Price Calculator India | Online Calculator 2026 | WoodenMax</title>',
    `<title>${TITLE}</title>`,
    log
  );
  html = once(
    html,
    'meta desc',
    '<meta name="description" content="FREE glass elevation price calculator India - Get instant price estimates in 30 seconds. Calculate curtain wall & structural glazing costs. No registration required. Used by 10,000+ homeowners. Works for Hyderabad, Delhi, Bangalore, Pune, Mumbai & all Indian cities. Calculate now →" />',
    `<meta name="description" content="${DESC}" />`,
    log
  );
  html = stripKeywords(html, log);
  html = once(
    html,
    'og:title',
    '<meta property="og:title" content="FREE Glass Elevation Price Calculator 2026 | Instant Quotes India | WoodenMax" />',
    `<meta property="og:title" content="${TITLE}" />`,
    log
  );
  html = once(
    html,
    'twitter:title',
    '<meta name="twitter:title" content="FREE Glass Elevation Price Calculator 2026 | Instant Quotes" />',
    `<meta name="twitter:title" content="${TITLE}" />`,
    log
  );
  html = once(
    html,
    'og:description',
    '<meta property="og:description" content="FREE glass elevation price calculator - Get instant price estimates in 30 seconds. Calculate curtain wall & structural glazing costs. No registration required. Used by 10,000+ homeowners. Works for Hyderabad, Delhi, Bangalore, Pune & all Indian cities. Calculate now →" />',
    `<meta property="og:description" content="${OG_DESC}" />`,
    log
  );
  html = once(
    html,
    'twitter:description',
    '<meta name="twitter:description" content="FREE glass elevation calculator - Get instant price estimates in 30 seconds. No registration. Used by 10,000+ homeowners. Works for all Indian cities. Calculate now →" />',
    `<meta name="twitter:description" content="${OG_DESC}" />`,
    log
  );
  html = once(html, 'H1 India', '<h1>Glass Elevation Price Calculator India</h1>', `<h1>${H1}</h1>`, log);
  html = stripAggregateRatingBlocks(html, log);
  html = all(
    html,
    'schema Free Online name',
    'Glass Elevation Price Calculator India | Free Online Calculator',
    TITLE,
    log
  );

  // Cross-link to primary aluminium calc without stealing intent
  if (!html.includes('data-fix-e-glass-role') && html.includes(`<h1>${H1}</h1>`)) {
    html = html.replace(
      `<h1>${H1}</h1>`,
      `<h1>${H1}</h1>\n <p data-fix-e-glass-role style="margin:0.75rem auto 0;max-width:820px;color:#e2e8f0;font-size:0.98rem;line-height:1.55;">Curtain wall and structural glazing only. For aluminium windows, use the <a href="/aluminium-window-price-calculator" style="color: var(--gold-400); text-decoration: underline;">aluminium window price calculator</a> or the <a href="/calculators" style="color: var(--gold-400); text-decoration: underline;">calculators hub</a>.</p>`
    );
    log.push('OK inject glass role blurb');
  }

  fs.writeFileSync(file, html);
  console.log('\n=== GLASS glass-elevation-price-calculator ===');
  log.forEach((l) => console.log(l));
}

polishPrimary();
polishHub();
polishSlidingCalc();
polishGlassElevation();
console.log('\nFix E polish complete.');
