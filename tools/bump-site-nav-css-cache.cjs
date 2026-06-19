/**
 * bump-site-nav-css-cache.cjs
 * Cache-busts every reference to css/site-nav.css so the navbar CLS fix
 * (position:fixed + body padding reservation) ships to returning visitors.
 *
 * Run: node tools/bump-site-nav-css-cache.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VER = '20260620';
let changed = 0, scanned = 0;

const SKIP_DIRS = new Set(['node_modules', '.git', 'tools', 'data', 'GSC', 'SGC ISSUE']);

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(p);
    } else if (ent.name.endsWith('.html')) {
      processFile(p);
    }
  }
}

function processFile(file) {
  let c = fs.readFileSync(file, 'utf8');
  if (!/site-nav\.css/.test(c)) return;
  scanned++;
  const before = c;
  // Replace site-nav.css with or without an existing ?v= query.
  c = c.replace(/site-nav\.css(?:\?v=[^"')\s]*)?/g, 'site-nav.css?v=' + VER);
  if (c !== before) {
    fs.writeFileSync(file, c, 'utf8');
    changed++;
  }
}

walk(ROOT);
console.log('site-nav.css references — scanned:', scanned, '| updated:', changed, '| version:', VER);
