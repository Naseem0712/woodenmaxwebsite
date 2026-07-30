/**
 * Smoke-test package feed image + link extraction without writing CSVs.
 * Run: node tools/verify-package-feed-images.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const genPath = path.join(__dirname, 'generate-package-merchant-feed.cjs');
const src = fs.readFileSync(genPath, 'utf8');
const cut = src.indexOf('\nconst rows = []');
if (cut < 0) {
  console.error('Could not locate rows bootstrap in generator');
  process.exit(1);
}
const prelude = src.slice(0, cut) + `
module.exports = { imageForProduct, productLink, LANDING_BY_ID, products, SITE };
`;
const sandbox = {
  module: { exports: {} },
  exports: {},
  require,
  console,
  process,
  Buffer,
  __dirname,
  __filename: genPath,
  setTimeout,
  clearTimeout
};
vm.runInNewContext(prelude, sandbox, { filename: genPath });
const api = sandbox.module.exports;

const samples = [
  'top-hung-casement',
  '29mm-sliding',
  'black-profile-shower-partition',
  'frameless-shower-partition',
  'slimline-aluminium-window'
];
const products = api.products.products || [];
console.log('Mapped landings sample checks:\n');
for (const id of samples) {
  const p = products.find((x) => x.id === id);
  if (!p) {
    console.log('MISSING product', id);
    continue;
  }
  const link = api.productLink(p);
  const imgs = api.imageForProduct(p);
  console.log('—', p.id);
  console.log('  link:', link);
  console.log('  primary:', (imgs.primary || '').replace(api.SITE, ''));
  const extras = (imgs.extrasCsv || '').split(',').map((s) => s.trim()).filter(Boolean);
  console.log('  extras:', extras.length);
  extras.slice(0, 8).forEach((u) => console.log('   +', u.replace(api.SITE, '')));
  console.log('');
}
