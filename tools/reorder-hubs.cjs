/**
 * tools/reorder-hubs.cjs
 *
 * Lifts the products grid above the long-form content on every
 * category hub page. Currently many hubs render:
 *   hero  →  rate-table / SEO band / gallery / why  →  product grid
 * Users want:
 *   hero  →  product grid  →  everything else
 * This script reorders the underlying HTML so the change benefits both
 * users (CTR / engagement) and SEO (above-the-fold content).
 *
 * Strategy:
 *   1. For each hub, locate the products `<section …>…</section>` block.
 *   2. Locate the hero `<section …>…</section>` block.
 *   3. Cut the products block from its current location and paste it
 *      immediately after the hero close tag.
 *   4. Idempotent: if a marker comment is already present, skip.
 *
 * Run:
 *   node tools/reorder-hubs.cjs           # apply
 *   node tools/reorder-hubs.cjs --dry     # preview
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY  = process.argv.includes('--dry');

// Per-hub config — uniquely-anchored regexes for hero block + products block.
const HUBS = [
  {
    file: 'products/aluminium-windows.html',
    heroBlock: /<section class="alum-hero">[\s\S]*?<\/section>/,
    productsBlock: /<section class="alum-products-section"[\s\S]*?<\/section>/,
  },
  // Catalog-style hubs (hero is a `<div class="page-header">…</div>` followed
  // by a wrapping `</section>` *or* sits next to a wrapper section — anchor on
  // the page-header div alone and grab through its closing div / section.
  {
    file: 'products/metal-louvers.html',
    heroBlock: /<div class="page-header"[\s\S]*?<\/section>/,
    productsBlock: /<section class="catalog-content"[\s\S]*?<\/section>/,
  },
  {
    file: 'products/glass-railing.html',
    heroBlock: /<div class="page-header"[\s\S]*?<\/section>/,
    productsBlock: /<section class="catalog-content"[\s\S]*?<\/section>/,
  },
  {
    file: 'products/shower-partitions.html',
    heroBlock: /<div class="page-header"[\s\S]*?<\/section>/,
    productsBlock: /<section class="catalog-content"[\s\S]*?<\/section>/,
  },
  {
    file: 'products/telescope-windows.html',
    heroBlock: /<div class="page-header"[\s\S]*?<\/section>/,
    productsBlock: /<section class="catalog-content"[\s\S]*?<\/section>/,
  },
  {
    file: 'products/folding-systems.html',
    heroBlock: /<div class="page-header"[\s\S]*?<\/section>/,
    productsBlock: /<section class="catalog-content"[\s\S]*?<\/section>/,
  },
  {
    file: 'products/elevation-cladding.html',
    heroBlock: /<div class="page-header"[\s\S]*?<\/section>/,
    productsBlock: /<section class="catalog-content"[\s\S]*?<\/section>/,
  },
  // grills.html uses its own classes (no .catalog-content). Anchor on the
  // "Product Cards" comment that prefixes the grid section.
  {
    file: 'products/grills.html',
    heroBlock: /<section class="grills-hero">[\s\S]*?<\/section>/,
    productsBlock: /<!--\s*Product Cards\s*-->\s*<section[\s\S]*?<\/section>/,
  },
  // glass-elevation.html and grills-tools-guide.html aren't classic hubs —
  // they're long-form pages without a separate product grid — skipped.
];

const MARKER_DONE = '<!-- products-grid-lifted-by-reorder-hubs -->';

function reorderOne (cfg) {
  const abs = path.join(ROOT, cfg.file);
  if (!fs.existsSync(abs)) return { file: cfg.file, status: 'missing' };

  let html = fs.readFileSync(abs, 'utf8');
  if (html.includes(MARKER_DONE)) return { file: cfg.file, status: 'already-done' };

  const heroMatch  = cfg.heroBlock.exec(html);
  const prodMatch  = cfg.productsBlock.exec(html);
  if (!heroMatch)  return { file: cfg.file, status: 'no-hero-block' };
  if (!prodMatch)  return { file: cfg.file, status: 'no-products-block' };

  // Detect if products already appears BEFORE hero (already reordered manually).
  if (prodMatch.index < heroMatch.index) {
    return { file: cfg.file, status: 'already-above-hero' };
  }

  const productsHtml = prodMatch[0].trim();
  const heroEnd      = heroMatch.index + heroMatch[0].length;

  // 1. Remove products block from its current location.
  const before = html.slice(0, prodMatch.index);
  const after  = html.slice(prodMatch.index + prodMatch[0].length);
  let combined = before + after;

  // 2. Recompute hero end inside the trimmed string (could be unchanged
  //    because hero is before products — but be safe).
  const heroMatchAfter = cfg.heroBlock.exec(combined);
  if (!heroMatchAfter) return { file: cfg.file, status: 'hero-lost-after-cut' };
  const insertAt = heroMatchAfter.index + heroMatchAfter[0].length;

  // 3. Insert products block right after hero close.
  const finalHtml =
    combined.slice(0, insertAt) +
    '\n\n  ' + MARKER_DONE + '\n  ' + productsHtml + '\n' +
    combined.slice(insertAt);

  if (!DRY) fs.writeFileSync(abs, finalHtml, 'utf8');
  return {
    file: cfg.file,
    status: 'reordered',
    bytes: finalHtml.length,
    productsLen: productsHtml.length,
  };
}

function main () {
  console.log(`\n[${DRY ? 'DRY-RUN' : 'APPLY'}] Reordering ${HUBS.length} hub pages.\n`);
  const out = HUBS.map(reorderOne);
  for (const r of out) {
    const tag =
      r.status === 'reordered'        ? '✓' :
      r.status === 'already-done'     ? '·' :
      r.status === 'already-above-hero' ? '·' :
      '✗';
    console.log(`  ${tag} ${r.file}  [${r.status}${r.productsLen ? `, products=${r.productsLen}b` : ''}]`);
  }
  const ok = out.filter((r) => r.status === 'reordered').length;
  const np = out.filter((r) => r.status === 'already-done' || r.status === 'already-above-hero').length;
  const err = out.filter((r) => !['reordered', 'already-done', 'already-above-hero'].includes(r.status)).length;
  console.log(`\nReordered: ${ok}    Already-done: ${np}    Errors: ${err}`);
}

main();
