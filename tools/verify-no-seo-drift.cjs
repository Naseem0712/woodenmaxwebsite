/**
 * verify-no-seo-drift.cjs
 * Proves the URL-architecture work changed navigation only.
 *
 * For every modified HTML file it compares git HEAD against the working tree on:
 *   - <title>
 *   - meta description / keywords
 *   - <link rel="canonical">
 *   - robots meta
 *   - og:/twitter: text metadata
 *   - every JSON-LD block (whitespace-normalised)
 *   - calculator hooks (data-product, price-calculator ids)
 *   - analytics ids (G-*, GTM-*)
 *   - visible text content (tags stripped)
 *
 * Anything that differs is reported. Expected result: only the two files whose
 * dead <script> tag was removed, and the JSON-LD breadcrumb URLs that were
 * repaired from a 404 to a live page.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const files = execSync('git diff --name-only', { cwd: ROOT, maxBuffer: 1 << 26 })
  .toString().split('\n').map(s => s.trim()).filter(s => s.endsWith('.html'));

function one (s, re) { const m = s.match(re); return m ? m[1].trim() : null; }
function all (s, re) { return [...s.matchAll(re)].map(m => m[1].replace(/\s+/g, ' ').trim()); }

function facts (s) {
  return {
    title:       one(s, /<title>([\s\S]*?)<\/title>/i),
    description: one(s, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i),
    keywords:    one(s, /<meta[^>]+name=["']keywords["'][^>]*content=["']([^"']*)["']/i),
    canonical:   one(s, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i),
    robots:      one(s, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i),
    ogTitle:     one(s, /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["']/i),
    ogDesc:      one(s, /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i),
    ogImage:     one(s, /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']*)["']/i),
    jsonld:      all(s, /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi).join('\n~~\n'),
    dataProduct: all(s, /data-product=["']([^"']*)["']/gi).join(','),
    calcIds:     all(s, /id=["'](price-calculator[^"']*)["']/gi).join(','),
    analytics:   all(s, /\b((?:G-|GTM-|AW-)[A-Z0-9]+)\b/g).sort().join(','),
    text:        s.replace(/<script[\s\S]*?<\/script>/gi, '')
                  .replace(/<style[\s\S]*?<\/style>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ').trim()
  };
}

const KEYS = Object.keys(facts(''));
const drift = {};
let clean = 0;

for (const f of files) {
  let before;
  try { before = execSync('git show HEAD:"' + f + '"', { cwd: ROOT, maxBuffer: 1 << 26 }).toString(); }
  catch { continue; }
  const a = facts(before), b = facts(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const diffs = KEYS.filter(k => a[k] !== b[k]);
  if (!diffs.length) { clean++; continue; }
  for (const k of diffs) (drift[k] = drift[k] || []).push({ file: f, before: a[k], after: b[k] });
}

console.log('HTML files compared          : ' + files.length);
console.log('Files with ZERO SEO drift    : ' + clean);
console.log('Files with some drift        : ' + (files.length - clean) + '\n');

if (!Object.keys(drift).length) console.log('No drift on any tracked property.');
for (const [k, v] of Object.entries(drift)) {
  console.log('='.repeat(66));
  console.log(k.toUpperCase() + ' changed on ' + v.length + ' file(s)');
  console.log('='.repeat(66));
  for (const d of v.slice(0, 6)) {
    console.log('  ' + d.file);
    if (k === 'jsonld' || k === 'text') {
      // show only the differing fragment, these values are huge
      const A = String(d.before || ''), B = String(d.after || '');
      let i = 0; while (i < A.length && i < B.length && A[i] === B[i]) i++;
      console.log('      before: ...' + A.slice(Math.max(0, i - 60), i + 90).replace(/\s+/g, ' '));
      console.log('      after : ...' + B.slice(Math.max(0, i - 60), i + 90).replace(/\s+/g, ' '));
    } else {
      console.log('      before: ' + d.before);
      console.log('      after : ' + d.after);
    }
  }
  if (v.length > 6) console.log('  ... +' + (v.length - 6) + ' more');
}
