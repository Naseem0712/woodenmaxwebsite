#!/usr/bin/env node
/**
 * Fix CSS loading site-wide (safe, idempotent):
 *  1. Core layout CSS → blocking rel="stylesheet" (fixes FOUC)
 *  2. calculator-mobile-ux / calculator-global → only on pages with embedded calc
 *
 * Usage:
 *   node tools/fix-css-loading.cjs
 *   node tools/fix-css-loading.cjs --dry
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const SKIP_DIRS = new Set(['node_modules', '.git', 'mcps', 'agent-transcripts', 'terminals', '.snapshots']);

const CORE_BLOCKING = new Set([
  'styles.css',
  'site-nav.css',
  'site-footer.css',
  'product-pages-global.css',
]);

const CALC_STYLES = new Set(['calculator-mobile-ux.css', 'calculator-global.css']);

const stats = {
  files: 0,
  changed: 0,
  coreBlocking: 0,
  calcRemoved: 0,
  calcBlocking: 0,
};

function walk(dir, out) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function cssBasename(href) {
  const file = href.split('/').pop() || '';
  return file.split('?')[0];
}

function needsHeavyCalculator(html, relPath) {
  if (/calculator-mobile-ux\.js/i.test(html)) return true;
  if (/calculator-global\.js/i.test(html)) return true;
  if (/id=["']price-calculator/i.test(html)) return true;
  if (/id=["']wmCalc\b/i.test(html)) return true;
  if (/class=["'][^"']*\bprice-calculator-container\b/i.test(html)) return true;
  if (/aluminium-window-price-calculator\.html$/i.test(relPath)) return true;
  if (/glass-elevation-price-calculator\.html$/i.test(relPath)) return true;
  if (/calculator-design-preview\.html$/i.test(relPath)) return true;
  return false;
}

function blockingLink(href) {
  return `<link rel="stylesheet" href="${href}">`;
}

const ASYNC_PAIR_RE =
  /<link rel="preload" href="([^"]+\.css[^"]*)" as="style" onload="this\.onload=null;this\.rel='stylesheet'">\s*<noscript><link rel="stylesheet" href="[^"]*"><\/noscript>/gi;

function removeCalcStyles(html) {
  let next = html;
  let n = 0;
  for (const name of CALC_STYLES) {
    const asyncRe = new RegExp(
      `\\s*<link rel="preload" href="[^"]*${name}[^"]*" as="style" onload="[^"]*">\\s*` +
        `<noscript><link rel="stylesheet" href="[^"]*${name}[^"]*"></noscript>`,
      'gi'
    );
    const blockRe = new RegExp(`\\s*<link rel="stylesheet" href="[^"]*${name}[^"]*"[^>]*>`, 'gi');
    const a = (next.match(asyncRe) || []).length;
    const b = (next.match(blockRe) || []).length;
    next = next.replace(asyncRe, '');
    next = next.replace(blockRe, '');
    n += a + b;
  }
  stats.calcRemoved += n;
  return next;
}

function processHtml(html, relPath) {
  let next = html;
  const wantCalc = needsHeavyCalculator(html, relPath);

  if (!wantCalc) {
    next = removeCalcStyles(next);
  }

  next = next.replace(ASYNC_PAIR_RE, (full, href) => {
    const base = cssBasename(href);
    if (CORE_BLOCKING.has(base)) {
      stats.coreBlocking++;
      return '\n  ' + blockingLink(href);
    }
    if (CALC_STYLES.has(base) && wantCalc) {
      stats.calcBlocking++;
      return '\n  ' + blockingLink(href);
    }
    return full;
  });

  return next;
}

function main() {
  const files = walk(ROOT);
  for (const file of files) {
    stats.files++;
    const rel = path.relative(ROOT, file).split(path.sep).join('/');
    const before = fs.readFileSync(file, 'utf8');
    const after = processHtml(before, rel);
    if (after === before) continue;
    stats.changed++;
    console.log(`  ${DRY ? '[dry] ' : ''}update: ${rel}`);
    if (!DRY) fs.writeFileSync(file, after, 'utf8');
  }

  console.log('\n--- fix-css-loading ---');
  console.log(`HTML scanned: ${stats.files}`);
  console.log(`Files changed: ${stats.changed}`);
  console.log(`Core/calc → blocking conversions: ${stats.coreBlocking + stats.calcBlocking}`);
  console.log(`Orphan calc stylesheet blocks removed: ${stats.calcRemoved}`);
  if (DRY) console.log('(dry run — no files written)');
}

main();
