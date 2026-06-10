#!/usr/bin/env node
/** Remove duplicate Product schema "image" string when an "image": [...] array also exists. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function walkHtml(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      walkHtml(abs, out);
    } else if (ent.name.endsWith('.html')) out.push(abs);
  }
  return out;
}

function fixBlock(block) {
  if (!/"@type"\s*:\s*"Product"/.test(block)) return block;
  if ((block.match(/"image"/g) || []).length < 2) return block;
  return block.replace(
    /"image"\s*:\s*"https:\/\/[^"]+"\s*,(?=\s*"(brand|category|sku)")/,
    ''
  );
}

function fixHtml(html) {
  return html.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
    (block) => fixBlock(block)
  );
}

let changed = 0;
for (const file of walkHtml(ROOT)) {
  const original = fs.readFileSync(file, 'utf8');
  const updated = fixHtml(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, 'utf8');
    changed++;
    console.log('  fixed', path.relative(ROOT, file));
  }
}
console.log(`Done. ${changed} file(s) updated.`);
