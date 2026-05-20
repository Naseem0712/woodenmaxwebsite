#!/usr/bin/env node
/**
 * Repair malformed async CSS / font blocks introduced by duplicate optimize-speed runs.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap';
const SKIP_DIRS = new Set(['node_modules', '.git', 'mcps', 'agent-transcripts', 'terminals', '.snapshots']);

let fixed = 0;

function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function repair(html) {
  let next = html;
  const before = next;

  // Collapse duplicate async CSS clusters (one preload + one noscript per .css file)
  next = next.replace(
    /(<link rel="preload" href="([^"]+\.css)" as="style" onload="this\.onload=null;this\.rel='stylesheet'">)(?:\s*<noscript>[\s\S]*?<\/noscript>)+/gi,
    (_, link, href) =>
      `${link}\n  <noscript><link rel="stylesheet" href="${href}"></noscript>`
  );

  // Fix broken Google Fonts blocks (empty href, nested noscript)
  next = next.replace(
    /<!-- Fonts with optimized loading[^]*?(?=\n\s*<!-- Critical|<!-- Critical above|\n\s*<style|\n\s*<style id="wm-critical)/i,
    (block) => {
      const m = block.match(/href="(https:\/\/fonts\.googleapis\.com[^"]+)"/);
      const url = m ? m[1] : 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap';
      if (!block.includes('href=" "') && !block.includes('</noscript></noscript>')) return block;
      return `<!-- Fonts with optimized loading (async) -->\n  <link href="${url}" rel="stylesheet" media="print" onload="this.media='all'; this.onload=null;">\n  <noscript><link href="${url}" rel="stylesheet"></noscript>\n  `;
    }
  );

  // Generic: fonts line followed by broken noscript (no comment marker)
  next = next.replace(
    /(<link href="(https:\/\/fonts\.googleapis\.com[^"]+)"[^>]*media="print"[^>]*>)\s*(?:<noscript>[\s\S]*?<\/noscript>\s*)+/gi,
    (_, link, url) =>
      `${link}\n  <noscript><link href="${url}" rel="stylesheet"></noscript>`
  );

  // Remove orphan broken font noscript with empty href
  next = next.replace(/\s*<noscript><link href=" " rel="stylesheet"[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Collapse repeated closing noscript tags
  next = next.replace(/<\/noscript>(\s*<\/noscript>)+/gi, '</noscript>');

  // Fix empty Google Fonts href from broken async-font pass
  next = next.replace(
    /<link href=" " rel="stylesheet" media="print" onload="this\.media='all';this\.onload=null;">/g,
    `<link href="${FONT_URL}" rel="stylesheet" media="print" onload="this.media='all';this.onload=null;">\n  <noscript><link href="${FONT_URL}" rel="stylesheet"></noscript>`
  );

  return { next, changed: next !== before };
}

function main() {
  const files = walk(ROOT);
  for (const file of files) {
    const { next, changed } = repair(fs.readFileSync(file, 'utf8'));
    if (!changed) continue;
    fixed++;
    const rel = path.relative(ROOT, file);
    console.log(`  fixed: ${rel}`);
    if (!DRY) fs.writeFileSync(file, next, 'utf8');
  }
  console.log(`\n${fixed} files ${DRY ? 'would be ' : ''}repaired.\n`);
}

main();
