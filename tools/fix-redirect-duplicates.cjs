/**
 * fix-redirect-duplicates.cjs
 * Removes the _redirects rules that served the SAME page at TWO URLs with a
 * 200, which is what let Google index both /x and /x/ as separate pages and,
 * because the two URLs have different base directories, made every relative
 * link on those pages resolve to a different target.
 *
 * Every trailing-slash alias becomes a 301 to the canonical no-slash URL.
 * Canonical targets were read from each page's <link rel="canonical">.
 *
 * Run: node tools/fix-redirect-duplicates.cjs           (dry run)
 *      node tools/fix-redirect-duplicates.cjs --apply
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const FILE = path.join(ROOT, '_redirects');

const lines = fs.readFileSync(FILE, 'utf8').split(/\r?\n/);
const out = [];
const changes = [];

for (const line of lines) {
  const t = line.trim();
  const parts = t.split(/\s+/);

  // A "/something/ <target> 200" rule is a trailing-slash duplicate: turn it
  // into a 301 onto the same path without the slash.
  if (!t.startsWith('#') && parts.length === 3 && parts[2] === '200' && parts[0].endsWith('/') && parts[0] !== '/') {
    const canonical = parts[0].replace(/\/$/, '');
    const replacement = parts[0] + ' ' + canonical + ' 301';
    changes.push({ from: t, to: replacement });
    out.push(replacement);
    continue;
  }
  out.push(line);
}

console.log((APPLY ? 'APPLIED' : 'DRY RUN') + ' — rules converted 200 -> 301: ' + changes.length + '\n');
changes.forEach(c => console.log('  - ' + c.from + '\n  + ' + c.to));

if (APPLY) fs.writeFileSync(FILE, out.join('\n'));
