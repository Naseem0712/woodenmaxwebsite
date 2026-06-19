/**
 * recompress-webp.cjs
 * Re-encodes large .webp images in place to shrink page weight site-wide.
 * Safe by design:
 *   - only touches .webp files above MIN_KB
 *   - caps width at MAX_W (never enlarges)
 *   - keeps the new file ONLY if it is meaningfully smaller (> SAVE_PCT)
 *
 * Run: node tools/recompress-webp.cjs           (dry run report)
 *      node tools/recompress-webp.cjs --apply   (write changes)
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const DIRS = ['images', 'blog', 'aluminium-iron-grills-design'];
const MIN_KB = 100;     // ignore already-small images
const MAX_W = 1600;     // cap very large images
const QUALITY = 80;
const SAVE_PCT = 4;     // keep only if at least this % smaller
const APPLY = process.argv.includes('--apply');

let files = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.webp$/i.test(ent.name)) files.push(p);
  }
}
DIRS.forEach(function (d) { walk(path.join(ROOT, d)); });

(async function () {
  let before = 0, after = 0, changed = 0, scanned = 0, skipped = 0;
  for (const f of files) {
    const orig = fs.statSync(f).size;
    if (orig < MIN_KB * 1024) continue;
    scanned++;
    try {
      // Read into a Buffer first: passing a path keeps the file open in libvips,
      // which then blocks writing back to the same file on Windows ("UNKNOWN open").
      const input = fs.readFileSync(f);
      const meta = await sharp(input).metadata();
      let pipe = sharp(input);
      if (meta.width && meta.width > MAX_W) {
        pipe = pipe.resize({ width: MAX_W, withoutEnlargement: true });
      }
      const buf = await pipe.webp({ quality: QUALITY, effort: 6 }).toBuffer();
      const saved = orig - buf.length;
      const pct = (saved / orig) * 100;
      if (pct >= SAVE_PCT) {
        before += orig; after += buf.length; changed++;
        if (APPLY) fs.writeFileSync(f, buf);
        console.log((APPLY ? 'OPT  ' : 'WOULD') + ' ' + (orig / 1024).toFixed(0) + 'KB -> ' + (buf.length / 1024).toFixed(0) + 'KB  ' + path.relative(ROOT, f));
      } else {
        skipped++;
      }
    } catch (e) {
      console.error('ERR  ' + path.relative(ROOT, f) + '  ' + e.message);
    }
  }
  console.log('\n' + (APPLY ? 'APPLIED' : 'DRY RUN') + ' — scanned >=' + MIN_KB + 'KB:', scanned,
    '| changed:', changed, '| left as-is:', skipped);
  console.log('Total: ' + (before / 1024 / 1024).toFixed(2) + ' MB -> ' + (after / 1024 / 1024).toFixed(2) + ' MB  (saved '
    + ((before - after) / 1024 / 1024).toFixed(2) + ' MB)');
})();
