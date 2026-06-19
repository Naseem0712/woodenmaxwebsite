/**
 * audit-serp-images.cjs
 * Diagnoses why Google may not show a thumbnail next to the blue link.
 * For every indexable .html it extracts: robots (max-image-preview), og:image,
 * declared og dimensions, twitter:image, JSON-LD image, and the first in-content
 * <img>. Then it reports systemic problems:
 *   - missing/!large max-image-preview
 *   - missing og:image
 *   - relative (non-absolute) og:image
 *   - og:image dimension mismatch vs the real file (and < 1200px wide)
 *   - heavy reuse of the same og:image across many URLs (boilerplate)
 *   - og:image not present anywhere in the page body (Google prefers on-page imgs)
 *
 * Run: node tools/audit-serp-images.cjs
 */
const fs = require('fs');
const path = require('path');
let sharp = null; try { sharp = require('sharp'); } catch (e) {}

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'tools', 'data', 'GSC', 'SGC ISSUE', 'api']);

const files = [];
function walk(d) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(d, ent.name);
    if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) walk(p); }
    else if (ent.name.endsWith('.html')) files.push(p);
  }
}
walk(ROOT);

function attr(html, re) { const m = html.match(re); return m ? m[1].trim() : ''; }
function urlToLocal(u) {
  if (!u) return '';
  let p = u.replace(/^https?:\/\/woodenmax\.in/i, '').split('?')[0].split('#')[0];
  p = decodeURIComponent(p).replace(/^\/+/, '');
  return path.join(ROOT, p);
}

const rows = [];
const ogCount = Object.create(null);

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const robots = attr(html, /<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const og = attr(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  const ogW = attr(html, /<meta[^>]*property=["']og:image:width["'][^>]*content=["']([^"']*)["']/i);
  const ogH = attr(html, /<meta[^>]*property=["']og:image:height["'][^>]*content=["']([^"']*)["']/i);
  const tw = attr(html, /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i);
  if (og) ogCount[og] = (ogCount[og] || 0) + 1;
  rows.push({ rel, robots, og, ogW: +ogW || 0, ogH: +ogH || 0, tw, html });
}

(async function () {
  const noLarge = [], noOg = [], relOg = [], mismatch = [], small = [], notOnPage = [], missingFile = [];
  for (const r of rows) {
    if (!/max-image-preview\s*:\s*large/i.test(r.robots)) noLarge.push(r.rel);
    if (!r.og) { noOg.push(r.rel); continue; }
    if (!/^https?:\/\//i.test(r.og)) relOg.push(r.rel);
    // on-page presence: filename appears in an <img>/preload in the body
    const fname = r.og.split('/').pop().split('?')[0];
    const onPage = fname && new RegExp(fname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(r.html.replace(/<head[\s\S]*?<\/head>/i, ''));
    if (!onPage) notOnPage.push(r.rel);
    // real file dimensions
    if (sharp) {
      const local = urlToLocal(r.og);
      if (!fs.existsSync(local)) { missingFile.push(r.rel + '  -> ' + r.og); continue; }
      try {
        const m = await sharp(fs.readFileSync(local)).metadata();
        if (m.width < 1200) small.push(r.rel + '  (' + m.width + 'x' + m.height + ')');
        if (r.ogW && r.ogH && (m.width !== r.ogW || m.height !== r.ogH)) {
          mismatch.push(r.rel + '  declared ' + r.ogW + 'x' + r.ogH + ' vs real ' + m.width + 'x' + m.height);
        }
      } catch (e) { missingFile.push(r.rel + '  (decode err)'); }
    }
  }

  const dupes = Object.entries(ogCount).filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]);

  function head(title, arr, n) {
    console.log('\n=== ' + title + ': ' + arr.length + ' ===');
    arr.slice(0, n || 12).forEach(x => console.log('  ' + x));
    if (arr.length > (n || 12)) console.log('  ... +' + (arr.length - (n || 12)) + ' more');
  }
  console.log('Total HTML pages scanned: ' + rows.length);
  head('Missing max-image-preview:large', noLarge, 15);
  head('Missing og:image', noOg, 15);
  head('Relative (non-absolute) og:image', relOg, 15);
  head('og:image file MISSING / undecodable', missingFile, 15);
  head('og:image real width < 1200px', small, 15);
  head('og:image declared-vs-real dimension mismatch', mismatch, 20);
  head('og:image NOT present as an on-page <img>', notOnPage, 15);
  console.log('\n=== Most reused og:image (>=5 pages) — boilerplate risk ===');
  dupes.slice(0, 20).forEach(([u, n]) => console.log('  ' + n + 'x  ' + u.replace('https://woodenmax.in', '')));
  console.log('  (distinct og:image values: ' + Object.keys(ogCount).length + ' across ' + rows.length + ' pages)');
})();
