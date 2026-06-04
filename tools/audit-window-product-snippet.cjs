const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'products', 'aluminium-windows');
const hub = path.join(root, 'products', 'aluminium-windows.html');

function parseAllLdJson(html) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      out.push(JSON.parse(m[1].trim()));
    } catch {
      out.push(null);
    }
  }
  return out;
}

const files = [
  hub,
  ...fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f)),
];

const noProduct = [];
const noOffers = [];
const badName = [];
const badPrice = [];

for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, '/');
  const html = fs.readFileSync(f, 'utf8');
  const blocks = parseAllLdJson(html);
  const products = blocks.filter((b) => b && b['@type'] === 'Product');

  if (products.length === 0) {
    noProduct.push(rel);
    continue;
  }

  for (const p of products) {
    if (!p.name) badName.push(rel);
    if (!p.offers) noOffers.push(rel);
    else {
      const lo = p.offers.lowPrice ?? p.offers.price;
      if (typeof lo === 'number' && lo > 1500) badPrice.push(`${rel} (low=${lo})`);
    }
  }
}

console.log('No Product:', noProduct.length);
noProduct.forEach((x) => console.log(' ', x));
console.log('\nProduct without offers:', [...new Set(noOffers)].length);
[...new Set(noOffers)].forEach((x) => console.log(' ', x));
console.log('\nProduct missing name:', [...new Set(badName)].length);
[...new Set(badName)].forEach((x) => console.log(' ', x));
console.log('\nSuspicious high lowPrice (>1500):', badPrice.length);
badPrice.forEach((x) => console.log(' ', x));
