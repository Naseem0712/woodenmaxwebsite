/**
 * Smoke-test + audit package feed images/links/prices.
 * Run: node tools/verify-package-feed-images.cjs
 *      npm run merchant:verify
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const genPath = path.join(__dirname, 'generate-package-merchant-feed.cjs');
const src = fs.readFileSync(genPath, 'utf8');
const cut = src.indexOf('\nconst rows = []');
if (cut < 0) {
  console.error('Could not locate rows bootstrap in generator');
  process.exit(1);
}
const prelude = src.slice(0, cut) + `
module.exports = {
  imageForProduct, productLink, LANDING_BY_ID, products, SITE,
  extractImagesFromHtml, imagesFromLanding, mergeProduct, api
};
`;
const m = new Module(genPath);
m.filename = genPath;
m.paths = Module._nodeModulePaths(path.dirname(genPath));
m._compile(prelude, genPath);
const api = m.exports;

const samples = [
  'top-hung-casement',
  '29mm-sliding',
  'black-profile-shower-partition',
  'frameless-shower-partition',
  'slimline-aluminium-window',
  '3track-sliding',
  'ceiling-pergola-louvers'
];

let fail = 0;
console.log('Mapped landings sample checks:\n');
for (const id of samples) {
  const p = (api.products.products || []).find((x) => x.id === id);
  if (!p) {
    console.log('MISSING product', id);
    fail += 1;
    continue;
  }
  const link = api.productLink(p);
  const imgs = api.imageForProduct(p);
  const extras = (imgs.extrasCsv || '').split(',').map((s) => s.trim()).filter(Boolean);
  const primary = (imgs.primary || '').replace(api.SITE, '');
  const badFallback = /2%20Track%20Aluminium%20Window\/2-track-aluminium-sliding-window-modern-home/i.test(primary)
    && p.id !== '29mm-sliding' && p.category === 'aluminium-windows' && !/sliding/i.test(p.id);
  console.log('—', p.id);
  console.log('  link:', link);
  console.log('  primary:', primary);
  console.log('  extras:', extras.length);
  extras.slice(0, 6).forEach((u) => console.log('   +', u.replace(api.SITE, '')));
  if (!link) { console.log('  FAIL no landing link'); fail += 1; }
  if (!imgs.primary) { console.log('  FAIL no primary image'); fail += 1; }
  if (badFallback) { console.log('  FAIL wrong category fallback primary'); fail += 1; }
  if (extras.length < 1 && p.category !== 'elevation-cladding') {
    console.log('  WARN few/no additional images');
  }
  console.log('');
}

// CSV audit if present
const csvPath = path.join(ROOT, 'products-packages-feed.csv');
if (fs.existsSync(csvPath)) {
  function parseCsvLine(line) {
    const out = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') { cur += '"'; i += 1; continue; }
        q = !q;
        continue;
      }
      if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
      cur += c;
    }
    out.push(cur);
    return out;
  }
  const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const hdr = parseCsvLine(lines[0]);
  const ix = Object.fromEntries(hdr.map((h, i) => [h, i]));
  const rows = lines.slice(1).map(parseCsvLine);
  const imgSet = new Set(rows.map((r) => r[ix.image_link]));
  const withExtras = rows.filter((r) => (r[ix.additional_image_link] || '').trim()).length;
  const pricesOk = rows.every((r) => {
    const n = parseFloat(String(r[ix.price] || '').replace(/[^\d.]/g, ''));
    return n > 0;
  });
  console.log('CSV rows:', rows.length);
  console.log('Unique image_link:', imgSet.size);
  console.log('Rows with additional_image_link:', withExtras + '/' + rows.length);
  console.log('All prices > 0:', pricesOk);
  if (!pricesOk) fail += 1;
  if (imgSet.size < 20) {
    console.log('FAIL too few unique image_link values');
    fail += 1;
  }

  // Price consistency: rebuild first package amount for sample products
  for (const id of ['3track-sliding', '29mm-sliding', 'frameless-shower-partition']) {
    const raw = (api.products.products || []).find((x) => x.id === id);
    if (!raw || !api.api) continue;
    const p = api.mergeProduct(raw);
    const pkgs = api.api.buildPackages(p) || [];
    if (!pkgs.length) continue;
    const expect = Math.round(pkgs[0].amount).toFixed(2) + ' INR';
    const row = rows.find((r) => (r[ix.id] || '').startsWith(id.replace(/[^a-z0-9]+/gi, '-').slice(0, 12)) || (r[ix.id] || '').includes(id.split('-')[0]));
    // looser match by title fragment
    const row2 = rows.find((r) => (r[ix.id] || '').indexOf(id) === 0 || (r[ix.id] || '').startsWith(id));
    const hit = row2 || rows.find((r) => (r[ix.title] || '').includes(pkgs[0].title.slice(0, 24)));
    if (!hit) {
      console.log('PRICE check skip (row not found):', id);
      continue;
    }
    const ok = hit[ix.price] === expect;
    console.log('PRICE', id, hit[ix.price], ok ? '==' : '!=', expect, ok ? 'OK' : 'FAIL');
    if (!ok) fail += 1;
  }
}

console.log(fail ? '\nFEED VERIFY FAILED (' + fail + ')' : '\nFEED VERIFY OK');
process.exit(fail ? 1 : 0);
