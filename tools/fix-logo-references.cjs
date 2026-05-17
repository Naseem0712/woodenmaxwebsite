#!/usr/bin/env node
/**
 * tools/fix-logo-references.cjs
 *
 * One-shot rewrite of every legacy logo path in HTML / sitemap files so
 * that nothing 404s at boot time.  The unified navbar (`js/site-nav.js`)
 * will purge old navbar markup *after* the browser has already started
 * the image request, so we must keep the static src valid.
 *
 * Replacements (case-sensitive, idempotent):
 *   images/woodenmax-logo.png         →  images/wm-logo.svg
 *   images/logo.webp                  →  images/wm-logo.svg
 *
 * Relative prefixes (../, ../../) are preserved automatically because
 * we only rewrite the trailing file name.
 *
 * Usage:
 *   node tools/fix-logo-references.cjs            # actually rewrite
 *   node tools/fix-logo-references.cjs --dry      # dry-run summary
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const DRY    = process.argv.includes('--dry');
const EXT    = new Set(['.html', '.htm', '.xml']);
const SKIP   = new Set(['node_modules', '.git', '_grills-source', 'tools']);

const PAIRS = [
  [/(woodenmax-logo)\.png\b/g, 'wm-logo.svg'.replace('wm-logo.svg', 'wm-logo.svg')],
];

// More precise: rewrite the full path segments, preserving any prefix.
const RULES = [
  { from: /(\.\.\/)*images\/woodenmax-logo\.png/g, to: (m) => m.replace(/woodenmax-logo\.png$/, 'wm-logo.svg') },
  { from: /(\.\.\/)*images\/logo\.webp/g,           to: (m) => m.replace(/logo\.webp$/, 'wm-logo.svg') },
];

let files = 0, hits = 0, touched = 0;

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
  const orig = fs.readFileSync(file, 'utf8');
  let next = orig;
  let count = 0;
  for (const rule of RULES) {
    next = next.replace(rule.from, (m) => { count++; return rule.to(m); });
  }
  if (count === 0) return;
  hits += count;
  touched++;
  const rel = path.relative(ROOT, file);
  console.log(`  ${count.toString().padStart(3)}×  ${rel}`);
  if (!DRY) fs.writeFileSync(file, next, 'utf8');
}

console.log(`\nfix-logo-references  ${DRY ? '(DRY RUN)' : ''}`);
console.log(`================================================`);
walk(ROOT);
console.log(`================================================`);
console.log(`Files scanned : ${files}`);
console.log(`Files touched : ${touched}`);
console.log(`Refs rewritten: ${hits}`);
console.log(DRY ? '\n(no files modified — re-run without --dry to apply)\n' : '\nDone.\n');
