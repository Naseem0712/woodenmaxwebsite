/**
 * fix-robots-image-preview.cjs
 * Ensures every indexable page tells Google it may show a large image preview
 * next to the blue link. Adds `max-image-preview:large, max-snippet:-1,
 * max-video-preview:-1` to any <meta name="robots"> that is index-able and
 * doesn't already have it. Idempotent; skips noindex pages.
 *
 * Run: node tools/fix-robots-image-preview.cjs           (dry run)
 *      node tools/fix-robots-image-preview.cjs --apply
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'tools', 'data', 'GSC', 'SGC ISSUE', 'api', '_grills-source']);
const APPLY = process.argv.includes('--apply');
const DIRECTIVES = 'max-image-preview:large, max-snippet:-1, max-video-preview:-1';

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p); }
    else if (e.name.endsWith('.html')) files.push(p);
  }
})(ROOT);

let changed = 0;
const re = /(<meta\s+name=["']robots["']\s+content=["'])([^"']*)(["'][^>]*>)/i;
for (const f of files) {
  let html = fs.readFileSync(f, 'utf8');
  const m = html.match(re);
  if (!m) continue;
  const content = m[2];
  if (/noindex/i.test(content)) continue;
  if (/max-image-preview/i.test(content)) continue;
  const newContent = content.replace(/\s*$/, '').replace(/,\s*$/, '') + ', ' + DIRECTIVES;
  const out = html.replace(re, m[1] + newContent + m[3]);
  if (out !== html) {
    changed++;
    console.log((APPLY ? 'FIX  ' : 'WOULD ') + path.relative(ROOT, f).replace(/\\/g, '/') + '   [' + content + '] -> [' + newContent + ']');
    if (APPLY) fs.writeFileSync(f, out);
  }
}
console.log('\n' + (APPLY ? 'APPLIED' : 'DRY RUN') + ' — pages updated: ' + changed + ' / scanned ' + files.length);
