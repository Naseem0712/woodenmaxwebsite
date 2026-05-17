#!/usr/bin/env node
/**
 * tools/fix-legal-entity.cjs
 *
 * Two-part site-wide cleanup requested by the brand owner:
 *
 *   1. Rename legal entity:
 *        "WoodenMax Industries Pvt Ltd"      →  "WoodenMax Architectural Elements"
 *        "WoodenMax Industries Private Ltd"  →  "WoodenMax Architectural Elements"
 *        "WoodenMax Industries"              →  "WoodenMax Architectural Elements"
 *      (we are NOT a Pvt Ltd; correct trading name is the latter)
 *
 *   2. Remove the placeholder CIN (we are not registered with MCA):
 *        Any occurrence of the literal "U45200TG2014PTC094876"
 *        Any preceding "CIN:" / "CIN -" label that becomes orphan
 *        Inline ` · CIN: ...` strips inside footers / meta
 *
 * Run:
 *   node tools/fix-legal-entity.cjs            # rewrite
 *   node tools/fix-legal-entity.cjs --dry      # preview only
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT  = path.resolve(__dirname, '..');
const DRY   = process.argv.includes('--dry');
const EXT   = new Set(['.html', '.htm', '.xml', '.json', '.txt', '.js', '.cjs', '.mjs']);
const SKIP  = new Set(['node_modules', '.git', '_grills-source']);
// Files we deliberately don't touch
const SKIP_FILES = new Set([
  'tools/fix-legal-entity.cjs',         // self
  'tools/fix-business-info.cjs',
  'tools/fix-logo-references.cjs',
  'tools/restore-official-logo.cjs',
  'CALCULATOR_FIX_PLAN.md',
  'TOPIC_CLUSTER_PROPOSAL.md',
]);

const RULES = [
  // -- Legal-entity rename (order matters — longest variant first) --------
  [/WoodenMax\s+Industries\s+Private\s+Limited/gi, 'WoodenMax Architectural Elements'],
  [/WoodenMax\s+Industries\s+Pvt\.?\s*Ltd\.?/gi,   'WoodenMax Architectural Elements'],
  [/WoodenMax\s+Industries\s+Pvt\.?\s*Ltd/gi,      'WoodenMax Architectural Elements'],
  // Bare "WoodenMax Industries" (no Pvt Ltd)
  [/WoodenMax\s+Industries\b/g,                    'WoodenMax Architectural Elements'],

  // -- CIN removal ---------------------------------------------------------
  // Inline "·  CIN: U45200TG2014PTC094876"  (and variations of separator)
  [/\s*[·•|]\s*CIN[:\s]+U45200TG2014PTC094876/gi, ''],
  // " CIN: U45200..." at line-start / standalone
  [/\bCIN[:\s]+U45200TG2014PTC094876\b/gi,         ''],
  // Raw value, if any
  [/U45200TG2014PTC094876/g,                       ''],
  // <span>CIN: ...</span> stripped to <span></span> -> cleanup empty spans
  [/<span[^>]*>\s*CIN[:\s]*<\/span>/gi,            ''],
  [/<span[^>]*>\s*<\/span>/g,                      ''],
];

let files = 0, touched = 0, hits = 0;

function shouldSkip(rel) { return SKIP_FILES.has(rel.replace(/\\/g, '/')); }

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
    next = next.replace(from, to);
    if (next !== before) {
      const m = before.match(from);
      count += m ? m.length : 0;
    }
  }
  if (count === 0) return;
  hits += count;
  touched++;
  console.log(`  ${count.toString().padStart(4)}×  ${rel}`);
  if (!DRY) fs.writeFileSync(file, next, 'utf8');
}

console.log(`\nfix-legal-entity  ${DRY ? '(DRY)' : ''}`);
console.log(`=========================================================`);
walk(ROOT);
console.log(`=========================================================`);
console.log(`Files scanned : ${files}`);
console.log(`Files touched : ${touched}`);
console.log(`Refs rewritten: ${hits}`);
console.log(DRY ? '\n(no files modified)\n' : '\nDone.\n');
