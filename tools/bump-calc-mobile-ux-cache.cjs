/**
 * bump-calc-mobile-ux-cache.cjs
 * Cache-busts calculator-mobile-ux.js and calculator-mobile-ux.css so modal /
 * sticky-bar / lead-form UX fixes ship everywhere.
 *
 * Run: node tools/bump-calc-mobile-ux-cache.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VER = '20260729f';
let changed = 0, scanned = 0;
const SKIP_DIRS = new Set(['node_modules', '.git', 'tools', 'data', 'GSC', 'SGC ISSUE']);

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) walk(p); }
    else if (ent.name.endsWith('.html')) processHtml(p);
    else if (ent.name === 'site-footer.js') processSiteFooter(p);
  }
}

function processHtml(file) {
  let c = fs.readFileSync(file, 'utf8');
  if (!/calculator-mobile-ux\.(js|css)/.test(c)) return;
  scanned++;
  const before = c;
  c = c.replace(/calculator-mobile-ux\.js(?:\?v=[^"')\s]*)?/g, 'calculator-mobile-ux.js?v=' + VER);
  c = c.replace(/calculator-mobile-ux\.css(?:\?v=[^"')\s]*)?/g, 'calculator-mobile-ux.css?v=' + VER);
  if (c !== before) { fs.writeFileSync(file, c, 'utf8'); changed++; }
}

/** Only bump WM_ASSET_V — leave concatenated '?v=' + WM_ASSET_V strings alone. */
function processSiteFooter(file) {
  let c = fs.readFileSync(file, 'utf8');
  scanned++;
  const before = c;
  c = c.replace(/var WM_ASSET_V = '[^']*'/, "var WM_ASSET_V = '" + VER + "'");
  if (c !== before) { fs.writeFileSync(file, c, 'utf8'); changed++; }
}

walk(ROOT);
console.log('calculator-mobile-ux css/js — scanned:', scanned, '| updated:', changed, '| version:', VER);
