#!/usr/bin/env node
'use strict';
/**
 * Batch 1B Reference v1 pilot migration — mechanical DOM/class transforms.
 * Preserves SEO, pricing, calculator markup; follows Batch 1A patterns.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const PAGES = [
  {
    rel: 'products/aluminium-windows/2-track-french-sliding-door.html',
    family: 'window',
    calcAnchor: '#price-calculator-2track-french',
    hubBack: '<p class="seo-hub-back" style="margin:0 0 1rem;"><a href="/products/aluminium-windows" style="color:#1E40AF;font-weight:600;text-decoration:none;">← All aluminium window prices</a></p>',
    sectionLabel: 'Aluminium Windows',
  },
  {
    rel: 'products/aluminium-windows/top-hung-casement-window.html',
    family: 'window',
    calcAnchor: '#price-calculator-top-hung-casement',
    hubBack: '<p class="seo-hub-back" style="margin:0 0 1rem;"><a href="/products/aluminium-windows" style="color:#1E40AF;font-weight:600;text-decoration:none;">← All aluminium window prices</a></p>',
    sectionLabel: 'Aluminium Windows',
  },
  {
    rel: 'products/glass-railing/balcony-glass-railing.html',
    family: 'railing',
    calcAnchor: '#price-calculator-glass-railing-balcony',
    hubBack: '<p class="seo-hub-back" style="margin:0 0 1rem;"><a href="/products/glass-railing" style="color:#1E40AF;font-weight:600;text-decoration:none;">← All glass railing prices</a></p>',
    sectionLabel: 'Frameless Glass Railing Systems',
    introClass: 'wm-railing-hero-intro',
    preGridBlocks: ['wm-railing-hero-cta', 'wm-explore-next', 'wm-railing-rate-panel'],
  },
  {
    rel: 'products/shower-partitions/frosted-glass-bathroom-door.html',
    family: 'shower',
    calcAnchor: '#price-calculator-frosted-glass-bathroom-door',
    hubBack: '<p class="seo-hub-back" style="margin:0 0 1rem;"><a href="/products/shower-partitions" style="color:#1E40AF;font-weight:600;text-decoration:none;">← All shower partition prices</a></p>',
    sectionLabel: 'Shower Partitions',
    introClass: 'wm-shower-hero-intro',
    preGridBlocks: ['wm-shower-hero-cta', 'wm-shower-rate-panel', 'shower-partition-types-panel'],
  },
];

function ensureHeadAssets(html) {
  if (!html.includes('product-image-gallery.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="\/css\/product-window-mobile\.css[^>]*>)/,
      '$1\n<link rel="stylesheet" href="/css/product-image-gallery.css?v=20260801s1">'
    );
    html = html.replace(
      /(<link rel="stylesheet" href="\/css\/product-pages-global\.css[^>]*>)/,
      '$1\n<link rel="stylesheet" href="/css/product-image-gallery.css?v=20260801s1">'
    );
  }
  if (!html.includes('product-page-pilot.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="\/css\/product-image-gallery\.css[^>]*>)/,
      '$1\n<link rel="stylesheet" href="/css/product-page-pilot.css?v=20260824c">'
    );
  }
  return html;
}

function extractBlock(html, className) {
  const re = new RegExp(
    `<div class="${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>[\\s\\S]*?</div>\\s*(?=\\n\\s*<(?:div|aside|section|p class="seo-hub))`,
    'i'
  );
  const m = html.match(re);
  if (m) {
    html = html.replace(m[0], '');
    return { html, block: m[0] };
  }
  // fallback: greedy until next major sibling at same indent
  const re2 = new RegExp(`(<div class="${className}"[\\s\\S]*?)(\\n\\s*<div class="(?:product-detail-grid|shower-partition-types-panel|wm-))`, 'i');
  const m2 = html.match(re2);
  if (m2) {
    const block = m2[1];
    html = html.replace(block, '');
    return { html, block };
  }
  return { html, block: '' };
}

function extractRatePanel(html) {
  const re = /(<div style="margin-bottom: 2rem; padding: 1\.5rem; background: linear-gradient\(135deg, #F0FDF4[\s\S]*?<\/div>\s*)\n(\s*<div class="product-detail-grid">)/;
  const m = html.match(re);
  if (m) {
    html = html.replace(m[0], m[2]);
    return { html, block: m[1] };
  }
  return { html, block: '' };
}

function migrateWindowPage(html, cfg) {
  // Hero section marker
  html = html.replace(
    /<section class="product-detail-hero">/,
    '<section class="product-detail-hero" data-product-page-layout="gallery-first">'
  );

  // Extract intro (first margin-bottom 2rem block with h1)
  const introRe = /(<div style="margin-bottom: 2rem;">\s*<span class="section-label"[\s\S]*?<\/p>\s*<\/div>)/;
  const introMatch = html.match(introRe);
  if (!introMatch) throw new Error('intro block not found');
  const introInner = introMatch[1]
    .replace(/^<div style="margin-bottom: 2rem;">/, '')
    .replace(/<\/div>$/, '');
  const sectionLabelMatch = introInner.match(/<span class="section-label"[\s\S]*?<\/span>/);
  const h1Match = introInner.match(/<h1[\s\S]*?<\/h1>/);
  const pMatch = introInner.match(/<p style="color: #475569;[\s\S]*?<\/p>/);
  const pilotIntro = `<div class="wm-product-pilot-intro" style="margin-bottom: 2rem;">
<div class="wm-product-pilot-context">
${cfg.hubBack}
${sectionLabelMatch ? sectionLabelMatch[0] : `<span class="section-label" style="display: inline-block; margin-bottom: 0.5rem;">${cfg.sectionLabel}</span>`}
</div>
<div class="wm-product-pilot-identity">
${h1Match ? h1Match[0] : ''}
${pMatch ? pMatch[0] : ''}
<a class="wm-calculator-finder" href="${cfg.calcAnchor}">Calculator Finder</a>
</div>
</div>`;
  html = html.replace(introMatch[0], pilotIntro);

  const { html: h2, block: ratePanel } = extractRatePanel(html);
  html = h2;

  html = html.replace(
    /<div class="product-detail-grid">/,
    '<div class="product-detail-grid wm-product-pilot-flow">'
  );
  html = html.replace(
    /<div class="product-image-gallery">/,
    '<div class="product-image-gallery wm-product-pilot-gallery">'
  );

  // Add data-product-pilot-source to description sections
  html = html.replace(
    /(<div class="product-description-section")(?![^>]*data-product-pilot-source)/g,
    '$1 data-product-pilot-source'
  );
  html = html.replace(
    /(<div class="key-features-section")(?![^>]*data-product-pilot-source)/g,
    '$1 data-product-pilot-source'
  );
  // Also handle description divs without class
  html = html.replace(
    /(<div style="margin-top: 2rem; padding: 1\.5rem; background: #FFFFFF; border-radius: 0\.75rem; border: 1px solid #E5E7EB;[\s\S]*?<h2[\s\S]*?Features)/,
    (m) => (m.includes('data-product-pilot-source') ? m : m.replace('<div style="margin-top: 2rem;', '<div data-product-pilot-source style="margin-top: 2rem;'))
  );

  // Wrap calculator column (second child of grid after gallery closes)
  html = html.replace(
    /(<div class="product-image-gallery wm-product-pilot-gallery">[\s\S]*?<\/div>\s*)\n(\s*)<div>/,
    '$1\n$2<div class="wm-product-pilot-calculator-column">\n$2'
  );

  // Insert rate panel at start of calculator column
  if (ratePanel) {
    html = html.replace(
      /(<div class="wm-product-pilot-calculator-column">\s*\n)/,
      `$1${ratePanel}\n`
    );
  }

  return html;
}

function migrateShowerOrRailingPage(html, cfg) {
  html = html.replace(
    /<section class="product-detail-hero">/,
    '<section class="product-detail-hero" data-product-page-layout="gallery-first">'
  );

  const introClass = cfg.introClass;
  const introRe = new RegExp(
    `(<div class="${introClass}" style="margin-bottom: 2rem;">[\\s\\S]*?<\\/div>)`
  );
  const introMatch = html.match(introRe);
  if (!introMatch) throw new Error(`intro ${introClass} not found`);
  const introInner = introMatch[1]
    .replace(new RegExp(`^<div class="${introClass}" style="margin-bottom: 2rem;">`), '')
    .replace(/<\/div>$/, '');

  // Remove standalone seo-hub-back if outside intro
  html = html.replace(/<p class="seo-hub-back"[\s\S]*?<\/p>\s*\n/, '');

  const sectionLabelMatch = introInner.match(/<span class="section-label"[\s\S]*?<\/span>/);
  const h1Match = introInner.match(/<h1[\s\S]*?<\/h1>/);
  const pMatch = introInner.match(/<p style="color: #475569;[\s\S]*?<\/p>/);

  const pilotIntro = `<div class="${introClass} wm-product-pilot-intro" style="margin-bottom: 2rem;">
<div class="wm-product-pilot-context">
${cfg.hubBack}
${sectionLabelMatch ? sectionLabelMatch[0] : `<span class="section-label" style="display: inline-block; margin-bottom: 0.5rem;">${cfg.sectionLabel}</span>`}
</div>
<div class="wm-product-pilot-identity">
${h1Match ? h1Match[0] : ''}
${pMatch ? pMatch[0] : ''}
<a class="wm-calculator-finder" href="${cfg.calcAnchor}">Calculator Finder</a>
</div>
</div>`;
  html = html.replace(introMatch[0], pilotIntro);

  const preBlocks = [];
  for (const cls of cfg.preGridBlocks || []) {
    if (cls === 'wm-explore-next') {
      const asideRe = /<aside class="wm-explore-next"[\s\S]*?<\/aside>\s*\n/;
      const am = html.match(asideRe);
      if (am) {
        preBlocks.push(am[0]);
        html = html.replace(am[0], '');
      }
      continue;
    }
    const { html: h, block } = extractBlock(html, cls);
    html = h;
    if (block) preBlocks.push(block);
  }

  html = html.replace(
    /<div class="product-detail-grid">/,
    '<div class="product-detail-grid wm-product-pilot-flow">'
  );
  html = html.replace(
    /<div class="product-image-gallery">/,
    '<div class="product-image-gallery wm-product-pilot-gallery">'
  );

  html = html.replace(
    /(<div class="product-description-section")(?![^>]*data-product-pilot-source)/g,
    '$1 data-product-pilot-source'
  );
  html = html.replace(
    /(<div class="key-features-section")(?![^>]*data-product-pilot-source)/g,
    '$1 data-product-pilot-source'
  );

  html = html.replace(
    /(<div class="product-image-gallery wm-product-pilot-gallery">[\s\S]*?<\/div>\s*)\n(\s*)<div>/,
    '$1\n$2<div class="wm-product-pilot-calculator-column">\n$2'
  );

  const preContent = preBlocks.join('\n');
  if (preContent) {
    html = html.replace(
      /(<div class="wm-product-pilot-calculator-column">\s*\n)/,
      `$1${preContent}\n`
    );
  }

  return html;
}

function finalizeScripts(html) {
  // Remove floating calc button block
  html = html.replace(
    /<!-- Floating Calculator Button[\s\S]*?<\/a>\s*\n/g,
    ''
  );
  html = html.replace(
    /<a href="#price-calculator[^"]*" class="floating-calc-button"[\s\S]*?<\/a>\s*\n/g,
    ''
  );
  html = html.replace(/\s*<script src="\/js\/floating-calc-button\.js[^"]*" defer><\/script>\s*\n/g, '\n');

  if (!html.includes('product-page-pilot.js')) {
    html = html.replace(
      /(<script src="\/js\/site-footer\.js[^"]*" defer><\/script>)/,
      '<script src="/js/product-page-pilot.js?v=20260824c" defer></script>\n  $1'
    );
  }
  return html;
}

for (const cfg of PAGES) {
  const file = path.join(root, cfg.rel);
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('data-product-page-layout="gallery-first"')) {
    console.log('SKIP already migrated:', cfg.rel);
    continue;
  }
  html = ensureHeadAssets(html);
  if (cfg.family === 'window') {
    html = migrateWindowPage(html, cfg);
  } else {
    html = migrateShowerOrRailingPage(html, cfg);
  }
  html = finalizeScripts(html);
  fs.writeFileSync(file, html, 'utf8');
  console.log('MIGRATED:', cfg.rel);
}
