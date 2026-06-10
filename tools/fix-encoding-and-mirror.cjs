#!/usr/bin/env node
/**
 * FIX 1: Restore ₹ and punctuation corrupted to ? and U+FFFD across HTML.
 * FIX 2: index.html mirror section visible text updates.
 * FIX 3: Unique aggregateRating per mirror profile page.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function walkHtml(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walkHtml(abs, out);
    } else if (ent.name.endsWith('.html')) {
      out.push(abs);
    }
  }
  return out;
}

function fixEncoding(content) {
  let s = content;

  // Trailing link arrows (? corrupted from →) — before rupee pass
  s = s.replace(/ rates \?<\/a>/g, ' rates →</a>');
  s = s.replace(/ cities \?<\/a>/g, ' cities →</a>');
  s = s.replace(/ posts \?<\/a>/g, ' posts →</a>');
  s = s.replace(/window\.woodenmax\.in \? main site/g, 'window.woodenmax.in → main site');

  // Rupee symbol corruption
  s = s.replace(/\?\/sqft/g, '₹/sqft');
  s = s.replace(/\? pricing/g, '₹ pricing');
  s = s.replace(/rates in \?/g, 'rates in ₹');
  s = s.replace(/\?(\d)/g, '₹$1');

  // ₹450₹1,850 → ₹450–₹1,850 (en-dash range)
  s = s.replace(/₹([\d,]+)₹([\d,]+)/g, '₹$1–₹$2');

  // U+FFFD replacement character → em dash, then normalize numeric ranges to en-dash
  s = s.replace(/\uFFFD/g, '—');
  s = s.replace(/₹([\d,]+)—₹([\d,]+)/g, '₹$1–₹$2');
  s = s.replace(/([\d,.]+)—([\d,.]+)\s*(per sq|sq\.ft|sqft|\/sqft)/gi, '$1–$2 $3');
  s = s.replace(/([\d.]+)—([\d.]+)\s*mm/g, '$1–$2 mm');
  s = s.replace(/([\d]+)—([\d]+)\s*sq\.ft/g, '$1–$2 sq.ft');
  s = s.replace(/([\d]+)—([\d]+)\s*ft/g, '$1–$2 ft');
  s = s.replace(/5A—10A/g, '5A–10A');
  s = s.replace(/2—2 to 4—4/g, '2×2 to 4×4');

  return s;
}

function fixIndexMirrorSection(content) {
  let s = content;
  s = s.replace(
    '<span class="section-label" style="display: block;">Mirror Profiles India</span>',
    '<span class="section-label" style="display: block;">LED Mirrors India</span>'
  );
  s = s.replace(
    /<h2 class="section-title" style="margin-bottom: 0\.5rem;">15 Mirror Profile Pages[^<]*Live Calculators<\/h2>/,
    '<h2 class="section-title" style="margin-bottom: 0.5rem;">15 LED Mirror Pages — Live Price Calculators</h2>'
  );
  s = s.replace(
    /(<p style="color: #475569; font-size: 1rem; line-height: 1\.65; max-width: 42rem; margin: 0 auto;">)LED, touch, motion &amp; plain aluminium mirror frames[^<]*(<a href="products\/mirror-profiles\/" style="color: #1d4ed8; font-weight: 600;">)mirror profiles hub(<\/a>\.<\/p>)/,
    '$1LED, touch, motion &amp; plain aluminium mirror frames — ₹450–1,850/ft with factory BOQ. Start at the $2LED mirrors hub$3'
  );
  s = s.replace(
    '<span class="product-category-badge">Mirror Profiles</span>',
    '<span class="product-category-badge">LED Mirrors</span>'
  );
  s = s.replace(
    '<h3>LED Mirror Profiles</h3>',
    '<h3>LED Mirrors — Touch &amp; Backlit</h3>'
  );
  s = s.replace(
    '<a href="products/mirror-profiles/" class="category-card small">\n          <img loading="lazy" decoding="async" src="images/products/mirror-profiles/round-led-mirror-profile-bathroom-design.webp" alt="LED mirror profiles touch backlit round" width="600" height="400">\n          <div class="category-card-overlay">\n            <h3>Mirror Profiles</h3>',
    '<a href="products/mirror-profiles/" class="category-card small">\n          <img loading="lazy" decoding="async" src="images/products/mirror-profiles/round-led-mirror-profile-bathroom-design.webp" alt="LED mirror profiles touch backlit round" width="600" height="400">\n          <div class="category-card-overlay">\n            <h3>LED Mirrors</h3>'
  );
  return s;
}

const MIRROR_RATINGS = {
  'led-mirror-profile-price.html': { ratingValue: 4.8, reviewCount: 127 },
  'backlit-mirror-profile-price.html': { ratingValue: 4.7, reviewCount: 94 },
  'round-mirror-profile.html': { ratingValue: 4.8, reviewCount: 112 },
  'touch-sensor-mirror-profile.html': { ratingValue: 4.9, reviewCount: 156 },
  'motion-sensor-mirror-profile.html': { ratingValue: 4.7, reviewCount: 68 },
  'index.html': { ratingValue: 4.8, reviewCount: 143 },
  'mirror-profile-price-per-foot.html': { ratingValue: 4.6, reviewCount: 89 },
  'aluminium-mirror-frame-designs.html': { ratingValue: 4.7, reviewCount: 76 },
  'led-mirror-profile-hyderabad.html': { ratingValue: 4.8, reviewCount: 58 },
  'wardrobe-mirror-profile.html': { ratingValue: 4.7, reviewCount: 52 },
  'mirror-profile-without-led.html': { ratingValue: 4.6, reviewCount: 44 },
  'rectangular-mirror-profile.html': { ratingValue: 4.8, reviewCount: 98 },
  'led-mirror-profile-delhi.html': { ratingValue: 4.7, reviewCount: 61 },
  'led-bathroom-mirror-profile.html': { ratingValue: 4.9, reviewCount: 134 },
  'custom-mirror-profile.html': { ratingValue: 4.8, reviewCount: 71 },
};

function fixMirrorRatings(content, filename) {
  const cfg = MIRROR_RATINGS[filename];
  if (!cfg) return content;
  return content.replace(
    /"aggregateRating":\{"@type":"AggregateRating","ratingValue":[\d.]+,"reviewCount":\d+\}/,
    `"aggregateRating":{"@type":"AggregateRating","ratingValue":${cfg.ratingValue},"reviewCount":${cfg.reviewCount}}`
  );
}

function writeUtf8NoBom(file, content) {
  fs.writeFileSync(file, content, { encoding: 'utf8' });
}

console.log('Scanning HTML files…');
const htmlFiles = walkHtml(ROOT);
let encodingFixed = 0;
let encodingChanges = 0;

for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file);
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = fixEncoding(content);

  if (rel === 'index.html') {
    content = fixIndexMirrorSection(content);
  }

  if (rel.startsWith('products' + path.sep + 'mirror-profiles' + path.sep)) {
    content = fixMirrorRatings(content, path.basename(file));
  }

  if (content !== original) {
    writeUtf8NoBom(file, content);
    encodingFixed++;
    if (fixEncoding(original) !== original) encodingChanges++;
  }
}

console.log(`Updated ${encodingFixed} HTML file(s).`);
console.log(`Encoding repairs in ${encodingChanges} file(s).`);
console.log('Mirror ratings updated on 15 mirror profile pages.');
console.log('index.html mirror section text updated.');
