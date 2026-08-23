#!/usr/bin/env node
/**
 * Keep links and package Offer URLs aligned with the historical short public
 * identity of the 15 shower guides. Content generators already emit short
 * guide links; this synchronizer repairs downstream static HTML and nav data.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { SLUGS, longPath, shortPath } = require('./shower-guide-identities.cjs');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const SKIP_DIRS = new Set(['.git', '.wrangler', 'node_modules', 'analysis', 'GSC', 'SGC ISSUE', 'tools']);

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkHtml(path.join(dir, entry.name), out);
    } else if (entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

function normalizePublicGuideUrls(text) {
  let next = text;
  let changes = 0;
  for (const slug of SLUGS) {
    const long = longPath(slug);
    const short = shortPath(slug);
    const substitutions = [
      [`https://woodenmax.in${long}`, `https://woodenmax.in${short}`],
      [`href="${long}"`, `href="${short}"`],
      [`href='${long}'`, `href='${short}'`],
      [`href=".${long}"`, `href=".${short}"`],
      [`href='.${long}'`, `href='.${short}'`],
      [`href="./shower-partitions/${slug}"`, `href="../../${slug}"`],
      [`href='./shower-partitions/${slug}'`, `href='../../${slug}'`],
    ];
    for (const [from, to] of substitutions) {
      const count = next.split(from).length - 1;
      if (count) {
        next = next.split(from).join(to);
        changes += count;
      }
    }
  }
  return { text: next, changes };
}

function normalizeNavTree() {
  const file = path.join(ROOT, 'js', 'nav-tree.js');
  let text = fs.readFileSync(file, 'utf8');
  let changes = 0;
  for (const slug of SLUGS) {
    const from = `products/shower-partitions/${slug}`;
    const count = text.split(from).length - 1;
    if (count) {
      text = text.split(from).join(slug);
      changes += count;
    }
  }
  if (changes && !CHECK) fs.writeFileSync(file, text, 'utf8');
  return { file, changes };
}

let filesChanged = 0;
let replacements = 0;
for (const file of walkHtml(ROOT)) {
  const before = fs.readFileSync(file, 'utf8');
  const result = normalizePublicGuideUrls(before);
  if (!result.changes) continue;
  filesChanged += 1;
  replacements += result.changes;
  if (!CHECK) fs.writeFileSync(file, result.text, 'utf8');
}
const nav = normalizeNavTree();
if (nav.changes) filesChanged += 1;
replacements += nav.changes;

if (CHECK && replacements) {
  console.error(`Found ${replacements} long shower-guide URL reference(s) in ${filesChanged} file(s).`);
  process.exitCode = 1;
} else {
  console.log(`${CHECK ? 'Verified' : 'Updated'} ${replacements} shower-guide URL reference(s) across ${filesChanged} file(s).`);
}
