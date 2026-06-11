#!/usr/bin/env node
/** Inject grill design gallery on grills HUB (products/grills.html), not product page. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HUB = path.join(ROOT, 'products/grills.html');
const PRODUCT = path.join(ROOT, 'products/grills/aluminium-window-grills.html');
const MANIFEST = path.join(ROOT, 'images/products/aluminium-iron-grills-design/gallery-manifest.json');
const items = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

function calcLink(item) {
  const c = item.categories;
  if (c.includes('balcony')) return './grills/balcony-safety-grills#grill-calc-balcony-safety';
  if (c.includes('staircase')) return './grills/staircase-balustrade-grills#grill-calc-staircase';
  if (item.materials.toLowerCase().includes('solid iron') || c.includes('round'))
    return './grills/iron-safety-grills#grill-calc-iron-safety';
  return './grills/aluminium-window-grills#grill-calc-aluminium-window';
}

const tabs = [
  { id: 'all', label: 'All' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'round', label: 'Round' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'staircase', label: 'Staircase' },
  { id: 'premium', label: 'Premium' },
];

const tabBtns = tabs
  .map(
    (t, i) =>
      `<button type="button" class="wm-grill-gallery-tab${i === 0 ? ' is-active' : ''}" data-filter="${t.id}" aria-pressed="${i === 0 ? 'true' : 'false'}">${t.label}</button>`
  )
  .join('\n        ');

const cards = items
  .map((item, i) => {
    const cats = item.categories.includes('all') ? 'all' : item.categories.join(' ');
    const loading = i < 3 ? 'eager' : 'lazy';
    const fetch = i < 3 ? ' fetchpriority="high"' : '';
    const src = `../images/products/aluminium-iron-grills-design/${item.file}`;
    const link = calcLink(item);
    return `        <figure class="wm-grill-gallery-item" data-categories="${cats}">
          <a href="${link}" class="wm-grill-gallery-link">
            <img src="${src}" alt="${item.alt.replace(/"/g, '&quot;')}" width="${item.width}" height="${item.height}" loading="${loading}" decoding="async"${fetch}>
          </a>
          <figcaption><strong>${item.name}</strong><span>${item.materials}</span></figcaption>
        </figure>`;
  })
  .join('\n');

const galleryBlock = `  <!-- Window Grill Designs Gallery (real fabrication photos) -->
  <section class="wm-grill-gallery-section" id="window-grill-designs-gallery" aria-labelledby="wm-grill-gallery-heading">
    <div class="container" style="max-width:1100px;">
      <h2 id="wm-grill-gallery-heading" class="wm-grill-gallery-title">Window Grill Designs Gallery</h2>
      <p class="wm-grill-gallery-lead">Browse ${items.length} real fabrication photos — vertical, horizontal, balcony, premium brass and solid iron bar styles. Filter by type, then tap a photo for the matching live calculator.</p>
      <div class="wm-grill-gallery-tabs" role="tablist" aria-label="Filter grill designs">
        ${tabBtns}
      </div>
      <div class="wm-grill-gallery-grid">
${cards}
      </div>
    </div>
  </section>

  <section class="wm-grill-materials-section" aria-labelledby="wm-grill-materials-heading">
    <div class="container" style="max-width:1100px;">
      <h2 id="wm-grill-materials-heading">Materials &amp; safety — which grill type suits your home?</h2>
      <div class="wm-grill-materials-prose">
        <p><strong>Vertical and horizontal grill designs</strong> are available in <strong>aluminium, iron and brass</strong>. Aluminium is rust-free and lightweight — ideal for upper floors and coastal homes. Iron is the strongest and most economical choice for ground-floor windows. Brass gives a premium look for main entrances and designer facades.</p>
        <p><strong>Round bar grills</strong> are made only in <strong>solid iron bars</strong>. Solid round bars deliver up to <strong>100% safety</strong> — they cannot be bent or cut easily and have the longest service life. Best for high-security windows and shop fronts.</p>
        <p><strong>Solid bar grills</strong> allow <strong>any custom design</strong> in solid bars for maximum security — ground floor homes, ATMs, store fronts and gates. We fabricate to your drawing or site measurement.</p>
        <p>Ready to price your size? Open any design above or jump to the <a href="#grills-calculators">grill calculators</a> below. Aluminium window grills: <a href="./grills/aluminium-window-grills#grill-calc-aluminium-window">live calculator</a>. Heavy-duty MS: <a href="./grills/iron-safety-grills">iron safety grills</a>.</p>
      </div>
    </div>
  </section>
`;

const imageObjects = items.map((item) => ({
  '@type': 'ImageObject',
  contentUrl: item.url,
  url: item.url,
  name: item.name,
  description: item.alt,
  width: item.width,
  height: item.height,
  isPartOf: {
    '@type': 'WebPage',
    url: 'https://woodenmax.in/products/grills#window-grill-designs-gallery',
  },
}));

const gallerySchema = `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Window grill design gallery',
  description: 'Aluminium, iron and brass window grill design photos by WoodenMax',
  numberOfItems: items.length,
  itemListElement: imageObjects.map((img, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: img,
  })),
})}</script>`;

const galleryCss = `
    .wm-grill-gallery-section { padding: 3rem 0 1.5rem; background: #fff; border-top: 1px solid #e2e8f0; }
    .wm-grill-gallery-title { font-size: 1.75rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; text-align: center; }
    .wm-grill-gallery-lead { text-align: center; color: #64748b; margin: 0 0 1.25rem; max-width: 42rem; margin-left: auto; margin-right: auto; line-height: 1.6; }
    .wm-grill-gallery-tabs { display: flex; flex-wrap: wrap; gap: 0.45rem; justify-content: center; margin-bottom: 1.25rem; }
    .wm-grill-gallery-tab { padding: 0.4rem 0.85rem; font-size: 0.82rem; font-weight: 600; border: 1px solid #cbd5e1; border-radius: 999px; background: #f8fafc; color: #334155; cursor: pointer; }
    .wm-grill-gallery-tab.is-active { background: #1e40af; border-color: #1e40af; color: #fff; }
    .wm-grill-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.85rem; }
    @media (min-width: 640px) { .wm-grill-gallery-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; } }
    .wm-grill-gallery-item { margin: 0; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc; }
    .wm-grill-gallery-link { display: block; text-decoration: none; }
    .wm-grill-gallery-item img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; }
    .wm-grill-gallery-item figcaption { padding: 0.55rem 0.65rem 0.7rem; font-size: 0.78rem; line-height: 1.45; color: #475569; }
    .wm-grill-gallery-item figcaption strong { display: block; color: #0f172a; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.15rem; }
    .wm-grill-gallery-item[hidden] { display: none; }
    .wm-grill-materials-section { padding: 1.75rem 0 2.5rem; background: linear-gradient(180deg, #f8fafc, #fff); border-top: 1px solid #e2e8f0; }
    .wm-grill-materials-section h2 { font-size: 1.35rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem; }
    .wm-grill-materials-prose { color: #334155; font-size: 0.95rem; line-height: 1.7; max-width: 48rem; }
    .wm-grill-materials-prose p { margin: 0 0 0.85rem; }
    .wm-grill-materials-prose a { color: #1e40af; font-weight: 600; text-decoration: none; }
    .wm-grill-materials-prose a:hover { text-decoration: underline; }
`;

const filterScript = `<script>
(function(){
  var tabs=document.querySelectorAll('.wm-grill-gallery-tab');
  var items=document.querySelectorAll('.wm-grill-gallery-item');
  tabs.forEach(function(btn){
    btn.addEventListener('click',function(){
      var f=btn.getAttribute('data-filter');
      tabs.forEach(function(b){b.classList.remove('is-active');b.setAttribute('aria-pressed','false');});
      btn.classList.add('is-active');btn.setAttribute('aria-pressed','true');
      items.forEach(function(el){
        if(f==='all'){el.hidden=false;return;}
        var cats=(el.getAttribute('data-categories')||'').split(/\\s+/);
        el.hidden=cats.indexOf(f)===-1;
      });
    });
  });
})();
</script>`;

// --- Hub page ---
let hub = fs.readFileSync(HUB, 'utf8');

if (!hub.includes('id="window-grill-designs-gallery"')) {
  // Replace old static 20-card gallery
  hub = hub.replace(
    /  <!-- Window grill design gallery \(GSC: window grill design\) -->[\s\S]*?  <\/section>\n\n  <!-- products-grid-lifted-by-reorder-hubs -->/,
    `${galleryBlock}\n\n  <!-- products-grid-lifted-by-reorder-hubs -->`
  );
}

if (!hub.includes('Window grill design gallery')) {
  hub = hub.replace('</head>', `${gallerySchema}\n</head>`);
}

if (!hub.includes('.wm-grill-gallery-section')) {
  hub = hub.replace('</style>', `${galleryCss}\n  </style>`);
}

if (!hub.includes('wm-grill-gallery-tab')) {
  hub = hub.replace('</body>', `${filterScript}\n</body>`);
}

// Update hub title for window grill design
hub = hub.replace(
  /<title>[^<]*<\/title>/,
  '<title>Window Grill Design Photos &amp; Price — 50+ Aluminium &amp; Iron Ideas (2026) | WoodenMax</title>'
);

fs.writeFileSync(HUB, hub, 'utf8');
console.log('✓ Gallery on grills hub (products/grills.html)');

// --- Remove from product page ---
let product = fs.readFileSync(PRODUCT, 'utf8');

if (product.includes('id="window-grill-designs-gallery"')) {
  product = product.replace(
    /  <!-- Window Grill Designs Gallery -->[\s\S]*?<\/section>\s*\n\s*<section class="wm-grill-materials-section"[\s\S]*?<\/section>\s*\n/,
    ''
  );
}

const hubGalleryLink = `  <p class="container" style="margin:1rem auto 0;padding:0.75rem 1rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:0.5rem;font-size:0.875rem;max-width:1280px;">
    <strong>21 real grill design photos</strong> — vertical, horizontal, balcony &amp; premium styles on the <a href="../grills#window-grill-designs-gallery" style="color:#1e40af;font-weight:600;">grills hub gallery</a>.
  </p>
`;

const heroVisual = `      <div class="grills-visual-stage" id="grills-visual-stage">
        <div class="grills-hero-photo" id="grills-hero-photo">
          <img loading="eager" decoding="async" src="../../images/products/Grills/aluminium-window-grill-design-modern.webp" alt="Aluminium Window Grill Design Modern Price Calculator" width="800" height="400">
        </div>
        <div class="grills-hero-preview-slot" id="grills-hero-preview-slot" aria-hidden="true"></div>
      </div>`;

// Restore hero visual stage after intro (inside hero)
if (!product.includes('grills-hero-photo')) {
  product = product.replace('      </header>\n    </div>\n  </section>', `      </header>\n${heroVisual}\n    </div>\n  </section>`);
} else if (!product.match(/grills-product-hero[\s\S]*?grills-hero-photo/)) {
  product = product.replace('      </header>\n    </div>\n  </section>', `      </header>\n${heroVisual}\n    </div>\n  </section>`);
}

if (!product.includes('grills hub gallery')) {
  product = product.replace('  </section>\n\n  <!-- Calculator', `  </section>\n\n${hubGalleryLink}\n\n  <!-- Calculator`);
}

// Remove duplicate visual stage inside calculator
product = product.replace(
  /\s*<div class="grills-visual-stage" id="grills-visual-stage" style="margin-bottom:1\.25rem;">[\s\S]*?<\/div>\n      <div id="grill-calc-aluminium-window"/,
  '\n      <div id="grill-calc-aluminium-window"'
);

// Remove gallery ImageObject schema from product page
product = product.replace(
  /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"ItemList","name":"Window grill design gallery"[\s\S]*?<\/script>\n/,
  ''
);

// Remove filter script from product page
product = product.replace(
  /<script>\n\(function\(\)\{\n  var tabs=document\.querySelectorAll\('\.wm-grill-gallery-tab'\);[\s\S]*?\}\)\(\);\n<\/script>\n/,
  ''
);

fs.writeFileSync(PRODUCT, product, 'utf8');
console.log('✓ Gallery removed from aluminium-window-grills.html');
