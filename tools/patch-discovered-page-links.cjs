#!/usr/bin/env node
/**
 * Strengthen internal links for GSC "Discovered – currently not indexed" URLs.
 * Run: node tools/patch-discovered-page-links.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CITY_SEO = {
  'bangalore.html': {
    label: 'Bengaluru',
    win: '../products/aluminium-windows/aluminium-window-price-bangalore',
    glass: '../products/glass-elevation/glass-elevation-price-bangalore',
  },
  'delhi.html': {
    label: 'Delhi NCR',
    win: '../products/aluminium-windows/aluminium-window-price-delhi',
    glass: '../products/glass-elevation/glass-elevation-price-delhi',
  },
  'mumbai.html': {
    label: 'Mumbai',
    win: '../products/aluminium-windows/aluminium-window-price-mumbai',
    glass: '../products/glass-elevation/glass-elevation-price-mumbai',
  },
  'pune.html': {
    label: 'Pune',
    win: '../products/aluminium-windows/aluminium-window-price-pune',
    glass: '../products/glass-elevation/glass-elevation-price-pune',
  },
  'hyderabad.html': {
    label: 'Hyderabad',
    win: '../products/aluminium-windows/aluminium-window-price-hyderabad',
    glass: null,
  },
  'jaipur.html': {
    label: 'Jaipur',
    win: null,
    glass: null,
    louver: '../products/metal-louvers/louver-price-jaipur',
  },
};

function patchCityPages() {
  let n = 0;
  for (const [file, cfg] of Object.entries(CITY_SEO)) {
    const fp = path.join(ROOT, 'city', file);
    if (!fs.existsSync(fp)) continue;
    let html = fs.readFileSync(fp, 'utf8');
    const marker = 'data-city-seo-links="1"';
    if (html.includes(marker)) continue;
    const chips = [];
    if (cfg.win) {
      chips.push(
        '<a href="' + cfg.win + '" ' + marker + ' style="padding: 0.5rem 1rem; background: #EFF6FF; color: #1E40AF; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 500; border: 1px solid #BFDBFE;">Aluminium window price (' + cfg.label + ')</a>'
      );
    }
    if (cfg.glass) {
      chips.push(
        '<a href="' + cfg.glass + '" ' + marker + ' style="padding: 0.5rem 1rem; background: #EFF6FF; color: #1E40AF; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 500; border: 1px solid #BFDBFE;">Glass elevation price (' + cfg.label + ')</a>'
      );
    }
    if (cfg.louver) {
      chips.push(
        '<a href="' + cfg.louver + '" ' + marker + ' style="padding: 0.5rem 1rem; background: #EFF6FF; color: #1E40AF; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 500; border: 1px solid #BFDBFE;">Louver price (' + cfg.label + ')</a>'
      );
    }
    if (!chips.length) continue;
    const needle = '<a href="../glass-elevation-price-calculator"';
    if (!html.includes(needle)) continue;
    html = html.replace(
      needle,
      chips.join('\n            ') + '\n            ' + needle
    );
    fs.writeFileSync(fp, html, 'utf8');
    n++;
  }
  return n;
}

function main() {
  console.log('City pages patched:', patchCityPages());
}

main();
