#!/usr/bin/env node
/**
 * tools/restore-official-logo.cjs
 *
 * Revert the temporary SVG-fallback paths back to the official PNG logo
 * that the brand owner has placed in /images/.
 *
 *   images/wm-logo.svg     →  images/woodenmax-logo.webp
 *   images/wm-favicon.svg  →  images/favicon.png
 *
 * Relative prefixes (../, ../../) are preserved.
 *
 * Run:
 *   node tools/restore-official-logo.cjs           # rewrite
 *   node tools/restore-official-logo.cjs --dry     # preview
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT  = path.resolve(__dirname, '..');
const DRY   = process.argv.includes('--dry');
const EXT   = new Set(['.html', '.htm', '.xml', '.json', '.js', '.cjs', '.mjs', '.md']);
const SKIP  = new Set(['node_modules', '.git', '_grills-source']);
const SKIP_FILES = new Set([
  'tools/restore-official-logo.cjs',
  'tools/fix-logo-references.cjs',
]);

const RULES = [
  [/images\/wm-logo\.svg/g,    'images/woodenmax-logo.webp'],
  [/images\/wm-favicon\.svg/g, 'images/favicon.png'],
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

console.log(`\nrestore-official-logo  ${DRY ? '(DRY)' : ''}`);
console.log(`=========================================================`);
walk(ROOT);
console.log(`=========================================================`);
console.log(`Files scanned : ${files}`);
console.log(`Files touched : ${touched}`);
console.log(`Refs rewritten: ${hits}`);
console.log(DRY ? '\n(no files modified)\n' : '\nDone.\n');
