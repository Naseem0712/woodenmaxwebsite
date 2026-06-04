const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'products', 'aluminium-windows');
const hub = path.join(root, 'products', 'aluminium-windows.html');

const files = [
  hub,
  ...fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f)),
];

function extractProductJson(html) {
  const re = /<script type="application\/ld\+json">(\{[^<]*"@type"\s*:\s*"Product"[^<]*\})<\/script>/g;
  let m;
  const blocks = [];
  while ((m = re.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(m[1]));
    } catch {
      blocks.push(null);
    }
  }
  return blocks;
}

const missing = [];
const invalid = [];
const noOffers = [];
const ok = [];

for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, '/');
  const slug = path.basename(f, '.html');
  const html = fs.readFileSync(f, 'utf8');
  const products = extractProductJson(html);

  if (products.length === 0) {
    missing.push(rel);
    continue;
  }

  for (const p of products) {
    if (!p) {
      invalid.push(`${rel} (parse error)`);
      continue;
    }
    const issues = [];
    if (!p.name && p.headline) issues.push('headline-not-name');
    if (!p.name && !p.headline) issues.push('no-name');
    if (!p.offers) issues.push('no-offers');
    if (!p.image) issues.push('no-image');
    if (!p.brand && !p.manufacturer) issues.push('no-brand');
    if (!p.sku && slug !== 'aluminium-windows' && !rel.includes('aluminium-window-price-')) {
      issues.push('no-sku');
    }

    if (issues.length) {
      invalid.push(`${rel}: ${issues.join(', ')}`);
    } else {
      ok.push(rel);
    }
    if (!p.offers) noOffers.push(rel);
  }
}

console.log('=== Missing Product JSON-LD ===');
missing.forEach((x) => console.log(x));
console.log('\n=== Product schema issues ===');
invalid.forEach((x) => console.log(x));
console.log('\n=== No offers (may be intentional guides) ===');
[...new Set(noOffers)].forEach((x) => console.log(x));
console.log('\nCounts: missing', missing.length, '| issues', invalid.length, '| ok', ok.length);
