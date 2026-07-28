const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'products', 'aluminium-windows');
const AP = '\u2019'; // curly apostrophe in HTML files

const COMPARE_TITLES = {
  'what-is-aluminium-system-window.html': 'System Window Price Guide — Entry, Mid & High Spec (2026)',
  'aluminium-system-window-price.html': 'System Window ₹/sqft — Reference BOQ by Spec Level (2026)',
  'system-sliding-window-price.html': 'System Sliding Window ₹/sqft — Spec Bands (2026)',
  'system-casement-window-price.html': 'System Casement ₹/sqft — Entry to High Spec (2026)',
  'slim-system-window-price.html': 'Slim System Window ₹/sqft — Premium Bands (2026)',
  'system-window-glass-options.html': 'Glass Upgrade Impact on System Window ₹/sqft (2026)',
  'system-window-for-villa.html': 'Villa System Window ₹/sqft — Premium Spec Bands (2026)',
  'system-window-vs-normal-window.html': 'System vs Normal Window — ₹/sqft Comparison (2026)',
  'system-window-installation.html': 'Installed System Window ₹/sqft — Supply + Site Lines (2026)',
  'aluminium-system-window-brands-india.html': 'Brand-Grade System Window ₹/sqft — 2026 Planning Table',
};

const OLD_H2 = `<h2 class="section-title">Aluminium system window — ₹/sqft comparison (this page${AP}s band)</h2>`;

for (const [file, title] of Object.entries(COMPARE_TITLES)) {
  const fp = path.join(DIR, file);
  let html = fs.readFileSync(fp, 'utf8');
  if (!html.includes(OLD_H2)) {
    console.log('SKIP (not found):', file);
    continue;
  }
  html = html.replace(OLD_H2, `<h2 class="section-title">${title}</h2>`);
  // Table header cleanup
  html = html.replace(
    new RegExp(`On this page${AP}s ([^<]+) strip`, 'g'),
    'Typical ₹/sqft ($1)'
  );
  html = html.replace(/Indicative ₹\/sqft \(this page\)/g, 'Indicative ₹/sqft');
  html = html.replace(/Upper half of strip/gi, 'Upper spec band');
  html = html.replace(/Upper part of the strip/gi, 'Upper spec band');
  fs.writeFileSync(fp, html, 'utf8');
  console.log('Fixed:', file);
}
