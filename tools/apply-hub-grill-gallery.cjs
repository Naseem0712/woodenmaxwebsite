#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HUB = path.join(ROOT, 'products/grills.html');
const MANIFEST = path.join(ROOT, 'images/products/aluminium-iron-grills-design/gallery-manifest.json');
const items = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

function calcLink(item) {
  const c = item.categories;
  if (c.includes('balcony')) return './grills/balcony-safety-grills#grill-calc-balcony-safety';
  if (c.includes('staircase')) return './grills/staircase-balustrade-grills#grill-calc-staircase';
  if (item.materials.toLowerCase().includes('solid iron'))
    return './grills/iron-safety-grills#grill-calc-iron-safety';
  return './grills/aluminium-window-grills#grill-calc-aluminium-window';
}

const tabs = ['all', 'vertical', 'horizontal', 'curved', 'balcony', 'premium'];
const tabLabels = { all: 'All', curved: 'Curved Iron' };
const tabBtns = tabs
  .map(
    (t, i) =>
      `<button type="button" class="wm-grill-gallery-tab${i === 0 ? ' is-active' : ''}" data-filter="${t}" aria-pressed="${i === 0 ? 'true' : 'false'}">${tabLabels[t] || t[0].toUpperCase() + t.slice(1)}</button>`
  )
  .join('\n        ');

const cards = items
  .map((item, i) => {
    const cats = item.categories.join(' ');
    return `        <figure class="wm-grill-gallery-item" data-categories="${cats}">
          <a href="${calcLink(item)}" class="wm-grill-gallery-link"><img src="../images/products/aluminium-iron-grills-design/${item.file}" alt="${item.alt.replace(/"/g, '&quot;')}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async"></a>
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

let hub = fs.readFileSync(HUB, 'utf8');

hub = hub.replace(
  /  <!-- Window grill design gallery \(GSC: window grill design\) -->[\s\S]*?  <\/section>\s*\n\s*<!-- products-grid-lifted-by-reorder-hubs -->/,
  `${galleryBlock}\n\n  <!-- products-grid-lifted-by-reorder-hubs -->`
);

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

if (!hub.includes('"name":"Window grill design gallery"')) {
  hub = hub.replace('</head>', `${gallerySchema}\n</head>`);
}

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

if (!hub.includes('wm-grill-gallery-tab')) {
  hub = hub.replace('</body>', `${filterScript}\n</body>`);
}

fs.writeFileSync(HUB, hub, 'utf8');
console.log('Hub gallery applied:', hub.includes('window-grill-designs-gallery'));
