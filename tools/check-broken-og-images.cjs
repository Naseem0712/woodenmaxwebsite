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

const broken = [];
for (const file of walk(path.join(ROOT, 'products'))) {
  const c = fs.readFileSync(file, 'utf8');
  const og = c.match(/property="og:image"\s+content="([^"]+)"/i);
  if (!og) continue;
  const local = decodeURIComponent(og[1].replace(/^https?:\/\/woodenmax\.in\//i, ''));
  if (!fs.existsSync(path.join(ROOT, local))) {
    broken.push({ rel: path.relative(ROOT, file).replace(/\\/g, '/'), local });
  }
}
console.log('broken og:image:', broken.length);
broken.forEach(({ rel, local }) => console.log(' ', rel, '->', local));
