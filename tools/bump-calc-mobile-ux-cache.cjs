/**
 * bump-calc-mobile-ux-cache.cjs
 * Cache-busts js/calculator-mobile-ux.js so the smart location field added to
 * the "Save & Export Quote PDF" / "Get Exact Price" lead modal ships everywhere.
 *
 * Run: node tools/bump-calc-mobile-ux-cache.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VER = '20260728e';
let changed = 0, scanned = 0;
const SKIP_DIRS = new Set(['node_modules', '.git', 'tools', 'data', 'GSC', 'SGC ISSUE']);

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) walk(p); }
    else if (ent.name.endsWith('.html')) processFile(p);
  }
}

function processFile(file) {
  let c = fs.readFileSync(file, 'utf8');
  if (!/calculator-mobile-ux\.js/.test(c)) return;
  scanned++;
  const before = c;
  c = c.replace(/calculator-mobile-ux\.js(?:\?v=[^"')\s]*)?/g, 'calculator-mobile-ux.js?v=' + VER);
  if (c !== before) { fs.writeFileSync(file, c, 'utf8'); changed++; }
}

walk(ROOT);
console.log('calculator-mobile-ux.js — scanned:', scanned, '| updated:', changed, '| version:', VER);
