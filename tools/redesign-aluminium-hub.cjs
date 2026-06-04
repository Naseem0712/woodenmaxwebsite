/**
 * Redesign products/aluminium-windows.html hub:
 * Title + intro → product cards → price table → editorial (no duplicate blocks).
 */
const fs = require('fs');
const path = require('path');

const HUB = path.resolve(__dirname, '../products/aluminium-windows.html');
let html = fs.readFileSync(HUB, 'utf8');

// CSS for compact hub header
if (!html.includes('.hub-page-header')) {
  html = html.replace(
    '/* Hero Section */',
    `/* Hub page header (compact) */
    .hub-page-header {
      padding: 5.5rem 0 2rem;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
      border-bottom: 1px solid #e2e8f0;
    }
    .hub-page-header .container { max-width: 1100px; }
    .hub-page-header h1 {
      font-size: clamp(1.75rem, 4vw, 2.35rem);
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
      margin: 0 0 0.75rem;
    }
    .hub-page-header .hub-lead {
      font-size: 1.05rem;
      color: #475569;
      line-height: 1.65;
      max-width: 820px;
      margin: 0 0 1rem;
    }
    .hub-page-header .hub-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .hub-page-header .hub-pill {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }
    .hub-page-header .hub-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .hub-price-section { padding: 2.5rem 0; background: #f8faff; }
    .hub-price-section h2 { margin: 0 0 0.35rem; font-size: 1.35rem; color: #0f172a; }
    .hub-price-section .hub-price-note { margin: 0 0 1.25rem; color: #64748b; font-size: 0.95rem; line-height: 1.6; max-width: 900px; }
    .hub-editorial { padding: 2.5rem 0 3rem; background: #fff; }
    .hub-editorial h2 { font-size: 1.25rem; color: #0f172a; margin: 0 0 1rem; }
    .hub-editorial p { color: #475569; line-height: 1.7; max-width: 900px; margin: 0 0 1rem; }
    .hub-editorial ul { color: #475569; line-height: 1.7; max-width: 900px; padding-left: 1.25rem; }
    .alum-products-section { padding-top: 1.5rem !important; }

    /* Hero Section (legacy — unused after redesign) */`
  );
}

const newHeader = `  <!-- Hub: title + intro (cards & table below) -->
  <section class="hub-page-header">
    <div class="container">
      <h1>Aluminium Window Price — 30 Designs + Live Calculator</h1>
      <p class="hub-lead">Compare sliding, casement, French, slim &amp; system windows from <strong>₹550–2250/sqft</strong> (2026 indicative). Every product page has a <strong>Live Calculator</strong> — size, glass &amp; hardware included; GST extra.</p>
      <div class="hub-pills">
        <span class="hub-pill">Live Calculator on every page</span>
        <span class="hub-pill">6063 T6 · Saint-Gobain glass</span>
        <span class="hub-pill">Hyderabad factory · pan-India supply</span>
      </div>
      <div class="hub-actions">
        <a href="#products" class="btn btn-primary">Browse 30 designs</a>
        <a href="#price-table" class="btn btn-outline">Quick price table</a>
        <a href="./aluminium-windows/aluminium-sliding-window-price-calculator" class="btn btn-outline">Open Live Calculator</a>
      </div>
    </div>
  </section>

`;

// Replace old hero
html = html.replace(
  /<!-- ============================================\s*\n\s*HERO SECTION[\s\S]*?<\/section>\s*\n\s*<!-- products-grid-lifted-by-reorder-hubs -->/,
  newHeader + '  <!-- Product cards -->'
);

// Remove duplicate SEO 20 block
html = html.replace(
  /<!-- 20 SEO satellite pages:[\s\S]*?<\/section>\s*\n\s*\n\s*<!-- Rate comparison \(after hero\) -->/,
  '  <!-- Price comparison table -->'
);

// Wrap rate section + update copy
html = html.replace(
  /<section style="padding: 2rem 0; background: #F8FAFF;">\s*\n\s*<div class="container">\s*\n\s*<!-- Industry Expert: Rate Comparison Panel -->/,
  `<section class="hub-price-section" id="price-table">
    <div class="container">
      <h2>Quick price comparison (₹/sqft, 2026)</h2>
      <p class="hub-price-note">Indicative supply rates for planning — Hindalco/import profiles, toughened or DGU glass, standard hardware. Open any row for specs, photos &amp; <strong>Live Calculator</strong>. GST &amp; transport extra.</p>
      <!-- Rate comparison panel -->`
);

html = html.replace(
  /<h3 style="margin: 0 0 0\.5rem; color: #0F172A; font-size: 1\.25rem; font-weight: 600;">Aluminium Windows Rate Comparison \| Industry Reference 2026<\/h3>\s*\n\s*<p style="margin: 0; color: #64748b; font-size: 0\.95rem; line-height: 1\.6;">Compare per sqft rates: the <strong>first table<\/strong> lists 9 main WoodenMax product lines\. <strong>Open the blue bar<\/strong> below to add the 20 SEO guide rate bands\. All indicative — Hindalco\/import profiles, Saint-Gobain glass, hardware; GST extra\.<\/p>/,
  ''
);

html = html.replace(
  /<summary style="padding: 0\.95rem 1\.5rem; cursor: pointer; font-size: 0\.95rem; font-weight: 600; color: #1E40AF; line-height: 1\.4;">Open full table — 20 SEO guide rate bands \(22 rows\) · click to expand \/ collapse<\/summary>\s*\n\s*<p style="margin: 0 1\.5rem 0\.75rem; color: #64748b; font-size: 0\.88rem; line-height: 1\.5;">Page-specific ₹\/sqft bands for the 20 satellite guides \(same links as the dark “20 guides” block above\)\. Main catalog \+ full elevation are in the table above\.<\/p>/,
  `<summary style="padding: 0.95rem 1.5rem; cursor: pointer; font-size: 0.95rem; font-weight: 600; color: #1E40AF; line-height: 1.4;">Show all 30 designs — system window &amp; price guides (expand)</summary>`
);

// Remove CATEGORY COMPARISON PANEL (duplicate mini grids)
html = html.replace(
  /<!-- CATEGORY COMPARISON PANEL -->[\s\S]*?<!-- ============================================\s*\n\s*GALLERY SECTION/,
  `<!-- Editorial -->
  <section class="hub-editorial">
    <div class="container">
      <h2>How to use this hub</h2>
      <p>Pick a design card or row in the price table — each dedicated page includes photos, configuration notes, FAQ, and a <strong>Live Calculator</strong> sized for Indian openings (feet, metres, or mm).</p>
      <ul>
        <li><strong>Budget sliding:</strong> 3-track Domal ₹550–950/sqft — balconies &amp; bedrooms with mesh.</li>
        <li><strong>Premium sliding:</strong> 29mm 2-track ₹1200–1400/sqft — DGU, imported rollers.</li>
        <li><strong>Openable:</strong> Top-hung / casement ₹750–1050/sqft — kitchens, baths, ventilation.</li>
        <li><strong>Luxury doors:</strong> French &amp; slim entrance ₹1350–2250/sqft — villas &amp; lobbies.</li>
        <li><strong>System window:</strong> Architect-grade €1200–3000/sqft bands — villas &amp; commercial facades.</li>
      </ul>
      <p>Need a firm number? Run the Live Calculator on the product page, then WhatsApp sizes + city for site validation.</p>
    </div>
  </section>

  <!-- REMOVED: duplicate comparison grids & gallery (see product cards above) -->
  <!-- ============================================
       GALLERY SECTION`
);

// Remove entire gallery section through end of gallery
html = html.replace(
  /<!-- ============================================\s*\n\s*GALLERY SECTION[\s\S]*?<!-- ============================================\s*\n\s*WHY CHOOSE SECTION/,
  `<!-- ============================================
       WHY CHOOSE SECTION`
);

// Shorten stuffed H2s
html = html.replace(
  /<h2>Why Choose Premium Aluminium Windows\? Best Aluminium Windows in India \| Sliding Windows, Casement Windows, French Doors<\/h2>/,
  '<h2>Why WoodenMax aluminium windows</h2>'
);
html = html.replace(
  /<h2>Aluminium Windows Technical Specifications \| Profile Types, Glass Options, Hardware Details<\/h2>/,
  '<h2>Technical specifications</h2>'
);

// Products section header
html = html.replace(
  /<h2>30 Aluminium Window Designs \| Live Calculator on Every Page<\/h2>\s*\n\s*<p>Premium aluminium windows for modern designs — <strong>30 designs & guides<\/strong> \(system window \+ price\/calculator\) with live tools and indicative ₹\/sq\.ft bands\.<\/p>/,
  '<h2>All window designs &amp; price pages</h2>\n        <p>30 cards — product lines, system guides, city rates &amp; tools. Each opens a page with <strong>Live Calculator</strong>.</p>'
);

// Add missing product cards (Georgian + French) before glass railing card
const extraCards = `
        <a href="./aluminium-windows/georgian-grill-casement-door" class="alum-product-card">
          <div class="alum-product-image">
            <span class="alum-product-badge">Luxury</span>
            <img loading="lazy" src="../images/products/aluminium-windows/aluminium-casement-door-georgian-grill.webp" alt="Georgian grill casement door" width="400" height="300" decoding="async">
          </div>
          <div class="alum-product-content">
            <h4>Georgian Grill Casement Door</h4>
            <p>40mm casement door with golden Georgian grill styling. Balcony &amp; entrance.</p>
            <div class="alum-product-features">
              <span class="alum-product-feat">₹1350–1850/sq.ft</span>
              <span class="alum-product-feat">Live Calculator</span>
            </div>
          </div>
        </a>
        <a href="./aluminium-windows/french-door-georgian-bar" class="alum-product-card">
          <div class="alum-product-image">
            <span class="alum-product-badge">Luxury</span>
            <img loading="lazy" src="../images/products/aluminium-windows/french-aluminium-door-georgian-bar.webp" alt="French door with Georgian bar" width="400" height="300" decoding="async">
          </div>
          <div class="alum-product-content">
            <h4>French Door (Georgian Bar)</h4>
            <p>Slim French door with Georgian bar — villa entrance &amp; lobby.</p>
            <div class="alum-product-features">
              <span class="alum-product-feat">₹1850–2250/sq.ft</span>
              <span class="alum-product-feat">Live Calculator</span>
            </div>
          </div>
        </a>
        <a href="./aluminium-windows/2-track-aluminium-window-price" class="alum-product-card">
          <div class="alum-product-image">
            <span class="alum-product-badge">Guide</span>
            <img loading="lazy" src="../images/products/2%20Track%20Aluminium%20Window/2-track-aluminium-sliding-window-modern-home.webp" alt="2 track window price guide" width="400" height="300" decoding="async">
          </div>
          <div class="alum-product-content">
            <h4>2 Track Window Price Guide</h4>
            <p>29mm premium sliding — dedicated price page + Live Calculator.</p>
            <div class="alum-product-features">
              <span class="alum-product-feat">₹1200–1400/sq.ft</span>
            </div>
          </div>
        </a>
`;

if (!html.includes('french-door-georgian-bar" class="alum-product-card')) {
  // already has french in grid? check - french might only be in gallery. Grid has 2-track-french-sliding-door but not french-door-georgian-bar
}
if (!html.includes('href="./aluminium-windows/french-door-georgian-bar" class="alum-product-card"')) {
  html = html.replace(
    /<!-- Glass Railing Link -->/,
    extraCards + '\n        <!-- Glass Railing Link -->'
  );
}
// Remove duplicate 2-track-aluminium-window-price card if we added one - there's already one at line 1449. So only add georgian + french
const extraCards2 = `
        <a href="./aluminium-windows/georgian-grill-casement-door" class="alum-product-card">
          <div class="alum-product-image">
            <span class="alum-product-badge">Luxury</span>
            <img loading="lazy" src="../images/products/aluminium-windows/aluminium-casement-door-georgian-grill.webp" alt="Georgian grill casement door" width="400" height="300" decoding="async">
          </div>
          <div class="alum-product-content">
            <h4>Georgian Grill Casement Door</h4>
            <p>40mm casement door with golden Georgian grill. Balcony &amp; entrance.</p>
            <div class="alum-product-features">
              <span class="alum-product-feat">₹1350–1850/sq.ft</span>
              <span class="alum-product-feat">Live Calculator</span>
            </div>
          </div>
        </a>
        <a href="./aluminium-windows/french-door-georgian-bar" class="alum-product-card">
          <div class="alum-product-image">
            <span class="alum-product-badge">Luxury</span>
            <img loading="lazy" src="../images/products/aluminium-windows/french-aluminium-door-georgian-bar.webp" alt="French door Georgian bar" width="400" height="300" decoding="async">
          </div>
          <div class="alum-product-content">
            <h4>French Door (Georgian Bar)</h4>
            <p>Slim French door with Georgian bar for villa entrance &amp; lobby.</p>
            <div class="alum-product-features">
              <span class="alum-product-feat">₹1850–2250/sq.ft</span>
              <span class="alum-product-feat">Live Calculator</span>
            </div>
          </div>
        </a>
`;
if (!html.includes('georgian-grill-casement-door" class="alum-product-card"')) {
  html = html.replace(/<!-- Glass Railing Link -->/, extraCards2 + '\n        <!-- Glass Railing Link -->');
}

// Remove duplicate 2-track guide card block if added in extraCards - I included 2-track in extraCards but there's already one - undo that part
html = html.replace(
  /<a href="\.\/aluminium-windows\/2-track-aluminium-window-price" class="alum-product-card">\s*<div class="alum-product-image">\s*<span class="alum-product-badge">Guide<\/span>\s*<img loading="lazy" src="\.\.\/images\/products\/2%20Track%20Aluminium%20Window\/2-track-aluminium-sliding-window-modern-home\.webp" alt="2 track window price guide"[\s\S]*?<\/a>\s*\n\s*<!-- Glass Railing Link -->/,
  '<!-- Glass Railing Link -->'
);

fs.writeFileSync(HUB, html);
console.log('Hub redesigned:', HUB);
