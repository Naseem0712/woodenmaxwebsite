#!/usr/bin/env node
/**
 * tools/fix-business-info.cjs
 *
 * Site-wide canonicalisation of business identity strings + cleanup of
 * the deleted /about/reviews-testimonials link.
 *
 *   Canonical address  : 5-6-411/413, Aaghapura, Nampally, Hyderabad 500001, Telangana, India
 *   Canonical GSTIN    : 36ARWPA9740L1Z3
 *   Canonical email    : info@woodenmax.com
 *   Canonical phone    : +91 78953 28080  (unchanged, kept here for sanity)
 *
 *   Reviews page (/about/reviews-testimonials) is DELETED — every link to
 *   it is rewritten to /about/case-study-makobrew-jubilee-hills as the
 *   nearest user-facing equivalent.
 *
 * Run:
 *   node tools/fix-business-info.cjs            # rewrite
 *   node tools/fix-business-info.cjs --dry      # dry-run
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT  = path.resolve(__dirname, '..');
const DRY   = process.argv.includes('--dry');
const EXT   = new Set(['.html', '.htm', '.xml', '.json', '.txt', '.md', '.js', '.cjs', '.mjs']);
const SKIP  = new Set(['node_modules', '.git', '_grills-source']);
// Files we intentionally don't touch — historical change logs, internal generator scripts
const SKIP_FILES = new Set([
  'CALCULATOR_FIX_PLAN.md',
  'TOPIC_CLUSTER_PROPOSAL.md',
  'tools/fix-business-info.cjs',           // self
  'tools/fix-logo-references.cjs',
  'tools/generate_merchant_feed.py',
]);

// Each rule is plain string OR { from: RegExp, to: function|string }
const RULES = [
  // -- Email canonicalisation ---------------------------------------------
  [/sales@woodenmax\.in/g,        'info@woodenmax.com'],
  [/support@woodenmax\.in/g,      'info@woodenmax.com'],
  [/hello@woodenmax\.in/g,        'info@woodenmax.com'],
  [/founder@woodenmax\.in/g,      'info@woodenmax.com'],
  [/escalation@woodenmax\.in/g,   'info@woodenmax.com'],
  [/careers@woodenmax\.in/g,      'info@woodenmax.com'],
  [/engineering@woodenmax\.in/g,  'info@woodenmax.com'],

  // -- GST canonicalisation -----------------------------------------------
  [/36AAFCW1234X1ZK/g,            '36ARWPA9740L1Z3'],
  [/36AAFFW1234A1Z5/g,            '36ARWPA9740L1Z3'],
  [/AAFFW1234A\b/g,               'ARWPA9740L'],   // PAN fragment cleanup

  // -- Address cleanups ----------------------------------------------------
  // Wrong full block ("Plot 51, Survey 38, Phase II, Hi-Tech City Layout, Hyderabad — 500081")
  [/Plot 51,\s*Survey 38,\s*Phase II,\s*Hi-Tech City Layout(?:,\s*Hyderabad)?(?:\s*&mdash;\s*500081|\s*-\s*500\s*081|\s*500081)?(?:,\s*Telangana)?(?:,\s*India)?/gi,
    '5-6-411/413, Aaghapura, Nampally, Hyderabad 500001, Telangana, India'],
  // Single-line "Plot 51 ... Hyderabad"
  [/Plot 51,\s*Hi-Tech City Layout,\s*Hyderabad/gi,
    '5-6-411/413, Aaghapura, Nampally, Hyderabad'],
  [/Plot 51,\s*Survey 38,\s*Phase II/gi,
    '5-6-411/413, Aaghapura'],
  // "Hi-Tech City" in addresses or postcodes
  [/Hi-Tech City Layout/gi,        'Nampally'],
  // Stand-alone "Hi-Tech City" near a postal context — replace conservatively only
  // when adjacent to "Hyderabad" within the same short segment.
  [/Hi-Tech City,\s*Hyderabad/gi,  'Nampally, Hyderabad'],
  [/Hyderabad,\s*Hi-Tech City/gi,  'Hyderabad, Nampally'],
  // Wrong postcode 500081 -> 500001
  [/Hyderabad\s*[-—]\s*500\s*081/g, 'Hyderabad — 500001'],
  [/Hyderabad,?\s*Telangana\s*500\s*081/g, 'Hyderabad, Telangana 500001'],
  [/Telangana\s*500081/g,          'Telangana 500001'],
  [/\b500\s*081\b/g,               '500001'],
  // Misspellings of "Aaghapura"
  [/Aaghpura/g,                    'Aaghapura'],
  [/Aghapura/g,                    'Aaghapura'],

  // -- Reviews page deletion ----------------------------------------------
  // Internal links of the form href="...about/reviews-testimonials(.html)?"
  [/about\/reviews-testimonials(?:\.html)?/g, 'about/case-study-makobrew-jubilee-hills.html'],
  // Display labels
  [/Reviews &amp; Testimonials/g,  'Case Study — Makobrew Cafe'],
  [/Reviews &amp; testimonials/g,  'Case Study — Makobrew Cafe'],

  // -- Founding-year drift fix (we noticed "since 2008" floating around) -
  [/since 2008/g,                  'since 2014'],
  [/founded in 2008/gi,            'founded in 2014'],
  [/operating since 2008/gi,       'operating since 2014']
];

let files = 0, touched = 0, hits = 0;

function shouldSkip(rel) {
  const norm = rel.replace(/\\/g, '/');
  return SKIP_FILES.has(norm);
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) { walk(full); continue; }
    if (!EXT.has(path.extname(name).toLowerCase())) continue;
    processFile(full);
  }
}

function processFile(file) {
  files++;
  const rel = path.relative(ROOT, file);
  if (shouldSkip(rel)) return;
  const orig = fs.readFileSync(file, 'utf8');
  let next = orig;
  let count = 0;
  for (const [from, to] of RULES) {
    const before = next;
    next = typeof to === 'function' ? next.replace(from, to) : next.replace(from, to);
    if (next !== before) {
      // count number of replacements
      const matches = before.match(from);
      count += matches ? matches.length : 0;
    }
  }
  if (count === 0) return;
  hits += count;
  touched++;
  console.log(`  ${count.toString().padStart(4)}×  ${rel}`);
  if (!DRY) fs.writeFileSync(file, next, 'utf8');
}

console.log(`\nfix-business-info  ${DRY ? '(DRY)' : ''}`);
console.log(`=========================================================`);
walk(ROOT);
console.log(`=========================================================`);
console.log(`Files scanned : ${files}`);
console.log(`Files touched : ${touched}`);
console.log(`Refs rewritten: ${hits}`);
console.log(DRY ? '\n(no files modified — re-run without --dry to apply)\n' : '\nDone.\n');
