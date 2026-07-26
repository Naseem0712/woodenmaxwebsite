/**
 * fix-broken-nav-targets.cjs
 * Repairs the navigation targets that the URL audit proved to be 404s.
 * Each repair below is backed by evidence, not a guess:
 *
 *  1. "Products" breadcrumb -> /products/  (16 pages, visible + BreadcrumbList
 *     JSON-LD). /products/ has no index page. The site's own dominant
 *     convention is "Products" -> /catalog (29 pages already do this), so the
 *     16 outliers are aligned to it. Breadcrumb schema shape is untouched —
 *     only the dead URL is corrected.
 *  2. products/aluminium-windows.html crosslink card "Glass Railing Systems"
 *     used ../glass-railing, which resolves to /glass-railing (404). The real
 *     page is /products/glass-railing.
 *  3. Two blog pages load ../js/navbar.js, a file that no longer exists
 *     (nav comes from js/site-nav.js). The dead <script> tag is removed.
 *
 * Run: node tools/fix-broken-nav-targets.cjs           (dry run)
 *      node tools/fix-broken-nav-targets.cjs --apply
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const SKIP = new Set(['node_modules', '.git', 'tools', 'GSC', 'SGC ISSUE', '_grills-source', '.snapshots', 'docs', 'server', 'lib']);

const files = [];
(function walk (d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP.has(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html')) files.push(p);
  }
})(ROOT);

// `only` restricts an edit to files where the link is actually broken. From
// products/*/x.html the same href resolves correctly, so those are left alone.
const EDITS = [
  { id: 'breadcrumb-products-visible', find: /href="(\.\.\/)+products\/"/g,            to: 'href="/catalog"' },
  { id: 'breadcrumb-products-jsonld',  find: /"item":"https:\/\/woodenmax\.in\/products\/"/g, to: '"item":"https://woodenmax.in/catalog"' },
  { id: 'glass-railing-crosslink',     find: /href="\.\.\/glass-railing"/g,            to: 'href="/products/glass-railing"',
    only: 'products/aluminium-windows.html' },
  { id: 'dead-navbar-script',          find: /[ \t]*<script defer src="\.\.\/js\/navbar\.js"><\/script>\r?\n/g, to: '' }
];

const tally = {};
let changed = 0;
for (const f of files) {
  const r = path.relative(ROOT, f).replace(/\\/g, '/');
  const src = fs.readFileSync(f, 'utf8');
  let out = src;
  for (const e of EDITS) {
    if (e.only && e.only !== r) continue;
    const hits = (out.match(e.find) || []).length;
    if (!hits) continue;
    out = out.replace(e.find, e.to);
    tally[e.id] = (tally[e.id] || 0) + hits;
    console.log('  ' + e.id.padEnd(28) + ' x' + hits + '  ' + r);
  }
  if (out !== src) { changed++; if (APPLY) fs.writeFileSync(f, out); }
}

console.log('\n' + (APPLY ? 'APPLIED' : 'DRY RUN') + ' — files changed: ' + changed);
for (const [k, v] of Object.entries(tally)) console.log('  ' + k.padEnd(28) + ' total ' + v);
