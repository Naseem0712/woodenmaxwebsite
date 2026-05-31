/**
 * Bump ?v= on calculator / payment assets in all HTML (cache-bust after deploy).
 * Run: node tools/bump-wm-asset-cache.cjs
 *      node tools/bump-wm-asset-cache.cjs --dry
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VERSION = process.env.WM_ASSET_V || '20260531';
const DRY = process.argv.includes('--dry');

const ASSETS = [
  'css/calculator-mobile-ux.css',
  'js/calculator-mobile-ux.js',
  'js/site-footer.js',
  'js/razorpay-checkout.js',
];

function walk (dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function bumpRefs (html) {
  let out = html;
  let n = 0;
  for (const asset of ASSETS) {
    const base = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(' + base + ')(\\?v=[^"\'\\s>]*)?', 'g');
    out = out.replace(re, function (_m, file) {
      n += 1;
      return file + '?v=' + VERSION;
    });
  }
  return { html: out, n };
}

let files = 0;
let refs = 0;
for (const f of walk(ROOT)) {
  const raw = fs.readFileSync(f, 'utf8');
  const { html, n } = bumpRefs(raw);
  if (n && html !== raw) {
    files += 1;
    refs += n;
    if (!DRY) fs.writeFileSync(f, html, 'utf8');
    console.log((DRY ? '[dry] ' : '') + path.relative(ROOT, f) + ' (' + n + ')');
  }
}
console.log('\nDone: ' + files + ' files, ' + refs + ' refs → ?v=' + VERSION);
