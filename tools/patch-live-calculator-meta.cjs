const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'products/aluminium-windows');

const META = {
  'slimline-aluminium-window.html':
    'Slimline aluminium window 2026 — ₹900–1400/sqft, black powder coating, Hindalco & Saint-Gobain. Live Calculator on page.',
  'slim-system-window-price.html':
    'Slim system window 2026 — ₹1350–3000/sqft for luxury villas. Minimal sightlines. Live Calculator vs standard 29mm.',
  'system-window-for-villa.html':
    'Best system window for villa 2026 — ₹1300–3000/sqft, full elevation strategy. Live Calculator for large glass panels.',
  'system-window-installation.html':
    'System window installation 2026 — fixing, waterproofing, alignment. Live Calculator before site mobilisation.',
  'system-window-glass-options.html':
    'System window glass 2026 — DGU, triple IGU, laminated options. Live Calculator + price impact breakdown.',
  'slim-aluminium-window-price-luxury.html':
    'Slim aluminium window luxury 2026 — ₹900–1500/sqft, minimal sightlines. Live Calculator & cost breakdown.',
  'aluminium-system-window-brands-india.html':
    'System window brands India 2026 — ₹1250–2950/sqft bands, hardware comparison. Live Calculator on linked pages.',
  'aluminium-sliding-window-price-calculator.html':
    'Free aluminium window Live Calculator 2026. Enter size, glass & coating — ₹/sqft range. WhatsApp to validate.',
  'slim-entrance-glass-door.html':
    'Slim entrance glass door 2026 — ₹1350–1850/sqft, 40mm profile, 8mm toughened glass. Live Calculator on page.',
  'sliding-vs-casement-window.html':
    'Sliding vs casement 2026 — cost, ventilation, noise. Live Calculator for sliding + casement tool links.',
  'what-is-aluminium-system-window.html':
    'What is aluminium system window 2026 — profiles, gaskets, hardware. ₹1220–2850/sqft + Live Calculator.',
  '2-track-aluminium-window-price.html':
    '2 track sliding window 2026 — ₹1200–1400/sqft. Live Calculator, glass & hardware breakdown. Compare track options.',
  '4-track-sliding-window-price.html':
    '4 track sliding window 2026 — ₹650–1200/sqft. Multi-panel mesh options. Live Calculator — upgrade to 29mm.',
  'aluminium-casement-window-price.html':
    'Casement window 2026 — ₹750–1050/sqft. Outward opening, mesh & multipoint. Live Calculator & cost breakdown.',
  'georgian-grill-casement-door.html':
    'Casement door 2026 — ₹1350–1850/sqft, 40mm profile, Georgian grill. Live Calculator on page.',
  'aluminium-sliding-window.html':
    'Premium 29mm sliding window 2026 — ₹1200–1400/sqft, mesh & DGU. Live Calculator with imported hardware.',
  'aluminium-window-glass-price-breakdown.html':
    'Window glass price breakdown 2026 — toughened, DGU, laminated. Live Calculator for total window cost.',
  'best-aluminium-window-for-home.html':
    'Best aluminium window for home 2026 — room picks ₹550–2250/sqft. Live Calculator to budget upgrades.',
  'aluminium-window-price-bangalore.html':
    'Aluminium window price Bengaluru 2026 — ₹550–2250/sqft. Live Calculator, finishes & install timelines.',
  'aluminium-window-price-chandigarh.html':
    'Aluminium window price Chandigarh 2026 — ₹550–2250/sqft. Live Calculator & transparent site visit pricing.',
  'aluminium-window-price-mumbai.html':
    'Aluminium window price Mumbai 2026 — ₹550–2250/sqft. Live Calculator, finishes & install timelines.',
  'aluminium-window-price-pune.html':
    'Aluminium window price Pune 2026 — ₹550–2250/sqft. Live Calculator, finishes & install timelines.',
  'aluminium-window-price-vijayawada.html':
    'Aluminium window price Vijayawada 2026 — ₹550–2250/sqft. Live Calculator & free site visit.',
  'aluminium-window-price-visakhapatnam.html':
    'Aluminium window price Visakhapatnam 2026 — ₹550–2250/sqft. Live Calculator & transport on ₹15L+ orders.',
  'aluminium-window-price-warangal.html':
    'Aluminium window price Warangal 2026 — ₹550–2250/sqft. Live Calculator, finishes & site visit.',
  'aluminium-window-price-delhi.html':
    'Aluminium window price Delhi NCR 2026 — ₹550–2250/sqft. Live Calculator, finishes & install timelines.',
  'system-sliding-window-price.html':
    'System sliding window 2026 — ₹1200–2780/sqft, 29mm hardware. Live Calculator for premium projects.',
  'system-casement-window-price.html':
    'System casement 2026 — ₹1280–2920/sqft. Multipoint & wind load specs. Live Calculator for facades.',
  'aluminium-system-window-price.html':
    'System window price 2026 — ₹1180–2680/sqft, brand profiles & DGU. Live Calculator for premium facades.',
};

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/'/g, '&apos;');
}

for (const [file, desc] of Object.entries(META)) {
  const abs = path.join(DIR, file);
  if (!fs.existsSync(abs)) continue;
  let html = fs.readFileSync(abs, 'utf8');
  const d = esc(desc);
  html = html.replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${d}"`);
  if (/<meta property="og:description"/i.test(html)) {
    html = html.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${d}"`);
  }
  if (/<meta name="twitter:description"/i.test(html)) {
    html = html.replace(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${d}"`);
  }
  fs.writeFileSync(abs, html);
  console.log('✓', file);
}
