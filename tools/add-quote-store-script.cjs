/**
 * Insert <script src="/js/quote-store.js"> immediately before every
 * calculator-mobile-ux.js tag.
 *
 * quote-store.js owns the quotation state that calculator-mobile-ux.js reads on
 * init, so it has to execute first. Both tags are `defer`, and deferred scripts
 * run in document order, so placing it directly before is sufficient.
 *
 *   node tools/add-quote-store-script.cjs         # dry run
 *   node tools/add-quote-store-script.cjs --apply
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');

const SKIP_DIRS = new Set(['node_modules', '.git', '.snapshots', 'GSC', 'SGC ISSUE', '_grills-source', 'tools']);

const UX_TAG_RE = /<script\b[^>]*\bsrc=(["'])([^"']*calculator-mobile-ux\.js[^"']*)\1[^>]*><\/script>/gi;

function walk (dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

/** Reuse the ?v= cache-buster from the neighbouring tag so both stay in step. */
function storeTagFor (uxSrc) {
  const m = uxSrc.match(/\?v=([^"'&]+)/);
  const version = m ? '?v=' + m[1] : '';
  return '<script defer src="/js/quote-store.js' + version + '"></script>';
}

const files = walk(ROOT, []);
let changedFiles = 0;
let inserted = 0;
let already = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (!/calculator-mobile-ux\.js/i.test(original)) continue;

  if (/src=["'][^"']*quote-store\.js/i.test(original)) {
    already++;
    continue;
  }

  UX_TAG_RE.lastIndex = 0;
  const updated = original.replace(UX_TAG_RE, (tag, _q, src) => {
    inserted++;
    return storeTagFor(src) + '\n  ' + tag;
  });

  if (updated === original) continue;
  changedFiles++;
  if (APPLY) fs.writeFileSync(file, updated);
}

console.log((APPLY ? 'APPLIED' : 'DRY RUN') + ' — quote-store.js script injection');
console.log('  HTML files scanned      : ' + files.length);
console.log('  files changed           : ' + changedFiles);
console.log('  script tags inserted    : ' + inserted);
console.log('  files already wired     : ' + already);
if (!APPLY) console.log('\nRe-run with --apply to write.');
