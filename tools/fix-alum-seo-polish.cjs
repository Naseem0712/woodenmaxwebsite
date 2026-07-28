/**
 * Polish aluminium-windows SEO pages:
 * - Convert wm-faq-card → faq-item accordion
 * - Fix system-window generic comparison panels & template wording
 * - Apply seo layout classes on system-window-seo-page heroes/sections
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'products', 'aluminium-windows');

const FAQ_TOGGLE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

const SYSTEM_PAGE_CONFIG = {
  'what-is-aluminium-system-window.html': {
    introH2: 'What Is a System Window — and What Should You Budget?',
    compareH2: 'System Window Price Guide — Entry, Mid & High Spec (2026)',
    heroLabel: 'System windows · complete guide',
    heroTitle: 'What Is an Aluminium System Window? — Profiles, Hardware & 2026 Prices',
  },
  'aluminium-system-window-price.html': {
    introH2: 'System Window Price in India — How to Read the ₹/sqft Bands',
    compareH2: 'System Window ₹/sqft — Reference BOQ by Spec Level (2026)',
    heroLabel: 'System windows · price index',
    heroTitle: 'Aluminium System Window Price — ₹1,180–2,680/sqft (2026 Guide)',
  },
  'system-sliding-window-price.html': {
    introH2: 'System Sliding Window Price — Large Openings & Track Hardware',
    compareH2: 'System Sliding Window ₹/sqft — Spec Bands (2026)',
    heroLabel: 'System sliding · 35mm Gulf series',
    heroTitle: 'System Sliding Window Price — ₹1,200–2,780/sqft (2026)',
  },
  'system-casement-window-price.html': {
    introH2: 'System Casement Window Price — 50mm Euro Stack',
    compareH2: 'System Casement ₹/sqft — Entry to High Spec (2026)',
    heroLabel: 'System casement · 50mm Euro',
    heroTitle: 'System Casement Window Price — ₹1,280–2,920/sqft (2026)',
  },
  'slim-system-window-price.html': {
    introH2: 'Slim System Window Price — Minimal Sightlines & Luxury Facades',
    compareH2: 'Slim System Window ₹/sqft — Premium Bands (2026)',
    heroLabel: 'Slim system · luxury facades',
    heroTitle: 'Slim System Window Price — ₹1,350–3,000/sqft (2026)',
  },
  'system-window-glass-options.html': {
    introH2: 'System Window Glass Options — Thickness, DGU & IGU Pricing',
    compareH2: 'Glass Upgrade Impact on System Window ₹/sqft (2026)',
    heroLabel: 'System windows · glass & IGU',
    heroTitle: 'System Window Glass Options — DGU, Laminated & ₹/sqft Adders',
  },
  'system-window-for-villa.html': {
    introH2: 'System Windows for Villas — Elevation-Grade Pricing',
    compareH2: 'Villa System Window ₹/sqft — Premium Spec Bands (2026)',
    heroLabel: 'System windows · villa projects',
    heroTitle: 'System Window for Villa — ₹1,300–3,000/sqft (2026 Guide)',
  },
  'system-window-vs-normal-window.html': {
    introH2: 'System Window vs Normal Window — Price & Performance Gap',
    compareH2: 'System vs Normal Window — ₹/sqft Comparison (2026)',
    heroLabel: 'System vs local make · comparison',
    heroTitle: 'System Window vs Normal Window — Which Costs More & Why?',
  },
  'system-window-installation.html': {
    introH2: 'System Window Installation Cost — Supply, Labour & Site Factors',
    compareH2: 'Installed System Window ₹/sqft — Supply + Site Lines (2026)',
    heroLabel: 'System windows · installation',
    heroTitle: 'System Window Installation Cost — Site, Crane & Sealing (2026)',
  },
  'aluminium-system-window-brands-india.html': {
    introH2: 'System Window Brands in India — Profile Classes & Pricing',
    compareH2: 'Brand-Grade System Window ₹/sqft — 2026 Planning Table',
    heroLabel: 'System windows · brands India',
    heroTitle: 'Aluminium System Window Brands in India — Gulf, Euro & Pricing',
  },
};

function convertFaqCards(html) {
  return html.replace(
    /<div class="wm-faq-card">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/gi,
    (_, question, answer) => {
      const q = question.trim();
      const a = answer.trim();
      return `<div class="faq-item">
          <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            <span>${q}</span>
            <div class="faq-toggle">
              ${FAQ_TOGGLE_SVG}
            </div>
          </div>
          <div class="faq-answer">
            <div class="faq-answer-content">${a}</div>
          </div>
        </div>`;
    }
  );
}

function polishTemplateWording(html) {
  let out = html;
  const ap = "[''']"; // straight or curly apostrophe
  // Remove awkward template phrases
  out = out.replace(/Planning strip:/gi, 'Typical installed range:');
  out = out.replace(/\bplanning strip\b/gi, 'price range');
  out = out.replace(/\bplanning range\b/gi, 'price range');
  out = out.replace(/the short answer:/gi, 'In plain terms:');
  out = out.replace(
    /,\s*In plain terms:/gi,
    ' — in plain terms,'
  );
  out = out.replace(
    /This guide uses a <strong>dedicated ([^<]+)<\/strong> price range \(supply \+ install, before GST\)\./gi,
    'Supply and install on this page typically runs <strong>$1</strong> (before GST).'
  );
  out = out.replace(
    /Broader market context often quotes ~₹1150–₹3000 for certified system work — the tables below are a tighter, page-specific slice for SEO and BOQ notes\./g,
    'Market rates for certified system work in India often span ₹1,150–3,000/sq.ft — the table below reflects this page’s calculator and product focus.'
  );
  out = out.replace(
    new RegExp(`On this page${ap}s ([^<]+) strip`, 'g'),
    'Typical ₹/sqft ($1)'
  );
  out = out.replace(/Indicative ₹\/sqft \(this page\)/g, 'Indicative ₹/sqft');
  out = out.replace(/Upper half of strip/gi, 'Upper spec band');
  out = out.replace(/Upper part of the strip/gi, 'Upper spec band');
  out = out.replace(new RegExp(`lower half of this page${ap}s strip`, 'gi'), 'entry spec band');
  out = out.replace(new RegExp(`upper half of this page${ap}s strip`, 'gi'), 'premium spec band');
  out = out.replace(new RegExp(`this page${ap}s ([₹0-9,–\\s]+)/sq\\.ft strip`, 'gi'), 'the $1/sq.ft range on this page');
  out = out.replace(new RegExp(`Start from this page${ap}s`, 'gi'), 'Start from the');
  out = out.replace(new RegExp(`Use this page${ap}s casement calculator`, 'gi'), 'Use the casement calculator on this page');
  out = out.replace(/Package line \(this page\):/g, 'What this page covers:');
  return out;
}

function fixSystemPage(html, cfg) {
  let out = html;
  const ap = "[''']";
  out = out.replace(
    /<h2 class="section-title">Premium pricing &amp; how to read the band<\/h2>/,
    `<h2 class="section-title">${cfg.introH2}</h2>`
  );
  out = out.replace(
    new RegExp(`<h2 class="section-title">Aluminium system window — ₹/sqft comparison \\(this page${ap}s band\\)<\\/h2>`),
    `<h2 class="section-title">${cfg.compareH2}</h2>`
  );

  // Hero polish
  out = out.replace(
    /<span class="section-label">System windows · premium guides<\/span>/,
    `<span class="section-label">${cfg.heroLabel}</span>`
  );
  out = out.replace(
    /<h1 style="font-family:'Playfair Display',serif;font-size:2\.1rem;color:#0f172a;margin:0\.5rem 0;">[\s\S]*?<\/h1>/,
    `<h1 class="seo-page-h1">${cfg.heroTitle}</h1>`
  );

  // Section width classes
  out = out.replace(
    /<section style="padding:3rem 0;background:#fff;" id="aluminium-system-intro">\s*<div class="container" style="max-width:900px;">/,
    '<section class="seo-content-section" id="aluminium-system-intro">\n    <div class="container seo-content-narrow">'
  );
  out = out.replace(
    /<section id="system-rate-comparison" class="system-window-compare" style="padding:3rem 0;background:#ecfeff;" aria-label="System window price comparison India">\s*<div class="container" style="max-width:960px;">/,
    '<section id="system-rate-comparison" class="system-window-compare seo-content-section" style="background:#ecfeff;" aria-label="System window price comparison India">\n    <div class="container seo-content-narrow">'
  );
  out = out.replace(
    /<section style="padding:3rem 0;background:#fff;" id="faqs">\s*<div class="container" style="max-width:900px;">/,
    '<section class="seo-faq-section" id="faqs">\n    <div class="container seo-faq-narrow">'
  );
  out = out.replace(
    /<section style="padding:3rem 0;background:#f8fafc;" id="window-price-calculator">\s*<div class="container">/,
    '<section class="seo-shower-calculator-section" id="window-price-calculator">\n    <div class="container">'
  );

  return out;
}

function fixMorningSeoFaqs(html) {
  let out = html;
  // Ensure FAQ sections use accordion-friendly wrapper
  out = out.replace(
    /(<section class="seo-faq-section" id="faqs">\s*<div class="container seo-faq-narrow">\s*<h2 class="section-title">FAQs<\/h2>\s*)(?!<div class="faq-section)/,
    '$1<div class="faq-section">\n      '
  );
  if (out.includes('class="seo-faq-section"') && out.includes('faq-item')) {
    out = out.replace(
      /(<div class="faq-item">[\s\S]*?<\/div>\s*)+\s*(<p style="margin-top:1\.5rem)/,
      (m) => {
        if (m.includes('class="faq-section"')) return m;
        return m.replace(/(<p style="margin-top:1\.5rem)/, '</div>\n      $1');
      }
    );
  }
  return out;
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
let changed = [];

for (const file of files) {
  const fp = path.join(DIR, file);
  let html = fs.readFileSync(fp, 'utf8');
  const before = html;

  if (html.includes('wm-faq-card')) {
    html = convertFaqCards(html);
  }

  html = polishTemplateWording(html);

  if (SYSTEM_PAGE_CONFIG[file]) {
    html = fixSystemPage(html, SYSTEM_PAGE_CONFIG[file]);
  }

  // Wrap FAQ items in faq-section if missing
  html = html.replace(
    /(<section class="seo-faq-section" id="faqs">\s*<div class="container seo-faq-narrow">\s*<h2 class="section-title">[^<]*<\/h2>\s*)(<div class="faq-item">)/,
    '$1<div class="faq-section">\n      $2'
  );
  html = html.replace(
    /(<section class="seo-faq-section" id="faqs">[\s\S]*?<div class="faq-section">[\s\S]*?)(<\/div>\s*<p style="margin-top:1\.5rem)/,
    '$1</div>\n      $2'
  );
  // Morning seo pages with seo-faq-section but no faq-section wrapper yet
  html = html.replace(
    /(<section class="seo-faq-section" id="faqs">\s*<div class="container seo-faq-narrow">\s*<h2 class="section-title">FAQs<\/h2>\s*)(<div class="faq-item">)/,
    '$1<div class="faq-section">\n      $2'
  );
  html = html.replace(
    /(<section class="seo-faq-section" id="faqs">[\s\S]*?<div class="faq-section">[\s\S]*?<\/div>\s*<\/div>\s*)\n(\s*<\/div>\s*<\/section>)/,
    (match) => {
      if (match.includes('</div>\n      </div>\n  </section>')) return match;
      return match.replace(/(<\/div>\s*)\n(\s*<\/div>\s*<\/section>)/, '$1</div>\n    $2');
    }
  );

  // System pages FAQ section class fix (non seo-faq yet)
  html = html.replace(
    /<section style="padding:3rem 0;background:#fff;" id="faqs">\s*<div class="container" style="max-width:900px;">/,
    '<section class="seo-faq-section" id="faqs">\n    <div class="container seo-faq-narrow">'
  );

  if (html !== before) {
    fs.writeFileSync(fp, html, 'utf8');
    changed.push(file);
  }
}

console.log('Updated', changed.length, 'files:');
changed.forEach((f) => console.log(' -', f));
