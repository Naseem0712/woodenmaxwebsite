#!/usr/bin/env node
/**
 * Fix GSC URL noise: clean contact links, hub /index redirects, search noindex header.
 * Run: node tools/fix-gsc-url-issues.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const SKIP = new Set(['node_modules', '.git', 'mcps', 'agent-transcripts', 'terminals']);

const REPLACEMENTS = [
  [/contact\.html\?/g, 'contact?'],
  [/href=(["'])\.\.\/\.\.\/contact\.html\?/g, 'href=$1../../contact?'],
  [/href=(["'])\.\.\/contact\.html\?/g, 'href=$1../contact?'],
  [/href=(["'])contact\.html\?/g, 'href=$1contact?'],
  [/href=(["'])\/contact\.html\?/g, 'href=$1/contact?'],
];

const PATCH_GLOBS = ['.html', '.js', '.mjs', '.cjs'];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (PATCH_GLOBS.some((ext) => e.name.endsWith(ext))) out.push(p);
  }
  return out;
}

function patchContactLinks() {
  let files = 0;
  let hits = 0;
  for (const abs of walk(ROOT, [])) {
    if (abs.includes('fix-gsc-url-issues.cjs')) continue;
    let t = fs.readFileSync(abs, 'utf8');
    let next = t;
    for (const [re, rep] of REPLACEMENTS) {
      next = next.replace(re, rep);
    }
    if (next !== t) {
      files++;
      hits += (t.match(/contact\.html\?/g) || []).length;
      if (!DRY) fs.writeFileSync(abs, next, 'utf8');
    }
  }
  return { files, hits };
}

function mergeRedirects() {
  const file = path.join(ROOT, '_redirects');
  let content = fs.readFileSync(file, 'utf8');
  const marker = '# GSC: index + hub cleanup (fix-gsc-url-issues.cjs)';
  if (content.includes(marker)) return 0;

  const block = [
    '',
    marker,
    '/index / 301',
    '/index/ / 301',
    '/products/metal-louvers /products/metal-louvers/ 200',
    '/products/metal-louvers/ /products/metal-louvers 301',
    '/products/metal-louvers/index /products/metal-louvers 301',
    '/products/metal-louvers/index/ /products/metal-louvers 301',
    '/products/metal-louvers/index.html /products/metal-louvers 301',
    '/products/metal-louvers/index.html/ /products/metal-louvers 301',
    '/products/metal-louvers.html /products/metal-louvers 301',
    '/products/metal-louvers.html/ /products/metal-louvers 301',
    '/products/pergola /products/pergola/ 200',
    '/products/pergola/ /products/pergola 301',
    '/products/pergola/index /products/pergola 301',
    '/products/pergola/index/ /products/pergola 301',
    '/products/pergola/index.html /products/pergola 301',
    '/products/pergola/index.html/ /products/pergola 301',
    '/products/pergola.html /products/pergola 301',
    '/products/pergola.html/ /products/pergola 301',
    '/products/mirror-profiles/index /products/mirror-profiles 301',
    '/products/mirror-profiles/index/ /products/mirror-profiles 301',
    '',
  ].join('\n');

  const insertAfter = '# www to non-www';
  const idx = content.indexOf(insertAfter);
  if (idx !== -1) {
    const lineEnd = content.indexOf('\n', idx);
    content = content.slice(0, lineEnd + 1) + block + content.slice(lineEnd + 1);
  } else {
    content = block + content;
  }
  if (!DRY) fs.writeFileSync(file, content.trimEnd() + '\n', 'utf8');
  return block.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length;
}

function mergeHeaders() {
  const file = path.join(ROOT, '_headers');
  let content = fs.readFileSync(file, 'utf8');
  const marker = '# GSC: noindex utility URLs';
  if (content.includes(marker)) return 0;

  const block = [
    '',
    marker,
    '/search',
    '  X-Robots-Tag: noindex, nofollow',
    '/search/*',
    '  X-Robots-Tag: noindex, nofollow',
    '/calculator-design-preview.html',
    '  X-Robots-Tag: noindex, nofollow',
    '',
  ].join('\n');

  if (!DRY) fs.writeFileSync(file, content.trimEnd() + block, 'utf8');
  return 1;
}

function main() {
  console.log('fix-gsc-url-issues' + (DRY ? ' (dry)' : '') + '\n');
  const links = patchContactLinks();
  const redirects = mergeRedirects();
  const headers = mergeHeaders();
  console.log('contact.html? → contact? in', links.files, 'files');
  console.log('new redirect rules:', redirects);
  console.log('headers block added:', headers > 0);
}

main();
