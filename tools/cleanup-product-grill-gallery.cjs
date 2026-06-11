#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../products/grills/aluminium-window-grills.html');
let html = fs.readFileSync(file, 'utf8');

html = html.replace(
  /  <!-- Window Grill Designs Gallery -->[\s\S]*?<section class="wm-grill-materials-section"[\s\S]*?<\/section>\s*\n/,
  ''
);

const heroVisual = `      <div class="grills-visual-stage" id="grills-visual-stage">
        <div class="grills-hero-photo" id="grills-hero-photo">
          <img loading="eager" decoding="async" src="../../images/products/Grills/aluminium-window-grill-design-modern.webp" alt="Aluminium Window Grill Design Modern Price Calculator" width="800" height="400">
        </div>
        <div class="grills-hero-preview-slot" id="grills-hero-preview-slot" aria-hidden="true"></div>
      </div>`;

if (!html.includes('grills-product-hero') || !html.match(/grills-product-hero[\s\S]{0,800}grills-visual-stage/)) {
  html = html.replace('      </header>\n    </div>\n  </section>', `      </header>\n${heroVisual}\n    </div>\n  </section>`);
}

const hubLink = `  <p class="container" style="margin:1rem auto 0;padding:0.75rem 1rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:0.5rem;font-size:0.875rem;max-width:1280px;">
    <strong>21 real grill design photos</strong> — vertical, horizontal, balcony &amp; premium styles on the <a href="../grills#window-grill-designs-gallery" style="color:#1e40af;font-weight:600;">grills hub gallery</a>.
  </p>
`;

if (!html.includes('grills hub gallery')) {
  html = html.replace('\n  <!-- Calculator', `\n\n${hubLink}\n\n  <!-- Calculator`);
}

html = html.replace(
  /\s*<div class="grills-visual-stage" id="grills-visual-stage" style="margin-bottom:1\.25rem;">[\s\S]*?<\/div>\n      <div id="grill-calc-aluminium-window"/,
  '\n      <div id="grill-calc-aluminium-window"'
);

html = html.replace(
  /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"ItemList","name":"Window grill design gallery"[\s\S]*?<\/script>\n/,
  ''
);

html = html.replace(
  /<script>\n\(function\(\)\{\n  var tabs=document\.querySelectorAll\('\.wm-grill-gallery-tab'\);[\s\S]*?\}\)\(\);\n<\/script>\n/,
  ''
);

fs.writeFileSync(file, html, 'utf8');
console.log('Product page cleaned');
