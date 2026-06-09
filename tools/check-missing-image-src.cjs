const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

const missing = [];
for (const file of walk(path.join(ROOT, 'products'))) {
  const c = fs.readFileSync(file, 'utf8');
  if (!/property="og:image"/i.test(c)) continue;
  if (!/rel=["']image_src["']/i.test(c)) {
    missing.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  }
}
console.log('og:image but no image_src:', missing.length);
missing.forEach((x) => console.log(' ', x));
