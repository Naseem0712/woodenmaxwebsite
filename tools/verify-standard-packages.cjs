/**
 * Live-rate verification for standard-size packages (windows + showers).
 * Expected amounts are derived from products.json — never hardcoded ₹.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
const g = products.globalRates;

const d = products.products.find((p) => p.id === '3track-sliding');
const s = products.products.find((p) => p.id === '29mm-sliding');
const c = products.products.find((p) => p.id === 'top-hung-casement');
const sh = products.products.find((p) => p.id === 'frameless-shower-partition');
const bp = products.products.find((p) => p.id === 'black-profile-shower-partition');

function expect(label, actual, expected) {
  const a = Number(Number(actual).toFixed(2));
  const e = Number(Number(expected).toFixed(2));
  const ok = a === e;
  console.log((ok ? 'OK ' : 'FAIL ') + label + ':', a, ok ? '' : '(expected ' + e + ')');
  return ok;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

let allOk = true;

const ctx = { window: null, document: null, location: { href: 'https://woodenmax.in/' }, setTimeout, clearTimeout };
ctx.window = ctx;
ctx.document = {
  readyState: 'complete',
  addEventListener: function () {},
  querySelectorAll: function () { return []; },
  getElementById: function () { return null; },
  createElement: function () {
    return { setAttribute: function () {}, appendChild: function () {}, style: {} };
  },
  head: { appendChild: function () {} },
  body: null
};

vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'standard-size-packages.js'), 'utf8'), ctx, {
  filename: 'standard-size-packages.js'
});
const api = ctx.WMStandardPackages;

function merge(p) {
  const rates = JSON.parse(JSON.stringify(p.rates || {}));
  if (rates.useGlobalRates && g) {
    if (g.glass) {
      rates.glass = Object.assign({}, g.glass, rates.glass || {});
      Object.keys(p.rates.glass || {}).forEach((k) => {
        if (p.rates.glass[k] === 0) rates.glass[k] = g.glass[k];
      });
    }
    if (g.mesh) {
      if (!rates.mesh) rates.mesh = Object.assign({}, g.mesh);
      else if (typeof rates.mesh === 'object') rates.mesh = Object.assign({}, g.mesh, rates.mesh);
    }
  }
  return Object.assign({}, p, { rates });
}

function meshAdder(product) {
  const rates = product.rates || {};
  if (rates.trackOptions && rates.trackOptions['3track'] != null) {
    return Number(rates.trackOptions['3track']) || 0;
  }
  const m = rates.mesh;
  if (typeof m === 'number') return m;
  if (m && typeof m === 'object') {
    if (/casement|slimline|georgian|top-hung/.test(product.id || '') && m.openable) {
      return Number(m.openable) || 0;
    }
    return Number(m.standard || m.openable || m.security) || 0;
  }
  return 0;
}

function expectWindow(label, pkg, product, withMesh) {
  const area = pkg.size.w * pkg.size.h;
  const glassMm = String(pkg.glassMm || 6) + 'mm';
  const glassExtra = Number((product.rates.glass && product.rates.glass[glassMm]) || 0);
  const rate = Number(product.rates.baseRate) + (withMesh ? meshAdder(product) : 0);
  const expected = round2(rate * area + (Number(product.rates.hardwareCost) || 0) + glassExtra * area);
  return expect(label, pkg.amount, expected);
}

const pkgsD = api.buildPackages(d);
allOk = expectWindow('Domal 2-track', pkgsD[0], d, false) && allOk;
allOk = expectWindow('Domal 3-track', pkgsD[1], d, true) && allOk;
console.log('Domal title 2T:', pkgsD[0].title);
console.log('Domal title 3T:', pkgsD[1].title);
allOk = /2 Track/.test(pkgsD[0].title) && /Without Mesh/.test(pkgsD[0].title) && allOk;
allOk = /3 Track/.test(pkgsD[1].title) && /With Mesh/.test(pkgsD[1].title) && allOk;
allOk = pkgsD[0].size.w === 5 && pkgsD[0].size.h === 4 && allOk;

const sm = merge(s);
const pkgs29 = api.buildPackages(sm);
allOk = expectWindow('29mm 2-track', pkgs29[0], sm, false) && allOk;
allOk = expectWindow('29mm 3-track', pkgs29[1], sm, true) && allOk;
allOk = pkgs29[0].glassMm === 8 && pkgs29[0].size.w === 7 && allOk;

const cm = merge(c);
const pkgsC = api.buildPackages(cm);
allOk = expect('casement swing packages', pkgsC.length >= 14, true) && allOk;
allOk = expect('casement 1.5x3 present', pkgsC.some((p) => p.size.w === 1.5 && p.size.h === 3), true) && allOk;
allOk = expect('casement half-fixed 3x8', pkgsC.some((p) => p.size.w === 3 && p.size.h === 8 && p.composite), true) && allOk;
const c15 = pkgsC.find((p) => p.size.w === 1.5 && p.size.h === 3 && !p.withMesh);
if (c15) {
  const expectedC = round2(cm.rates.baseRate * 1.5 * 3 + cm.rates.hardwareCost);
  allOk = expect('casement 1.5x3 amount', c15.amount, expectedC) && allOk;
}

const pkgsSh = api.buildPackages(sh);
allOk = expect('frameless card count', pkgsSh.length, 8) && allOk;
const sh5 = pkgsSh.find((p) => p.size.w === 5 && p.mode === 'hinged');
const sh5s = pkgsSh.find((p) => p.size.w === 5 && p.mode === 'sliding');
const shArea = 5 * 7;
allOk =
  expect('frameless 5x7 hinged', sh5.amount, round2(shArea * sh.rates.hinged.glassRate + sh.rates.hinged.hardware['mill-finish'])) &&
  allOk;
allOk =
  expect(
    'frameless 5x7 sliding',
    sh5s.amount,
    round2(shArea * sh.rates.sliding.glassRate + sh.rates.sliding.hardware['mill-finish'])
  ) && allOk;
allOk = /10mm/.test(sh5.title) && /2\.5 ft Door/.test(sh5.title) && allOk;
allOk = /Half-Half/.test(sh5s.title) && allOk;
console.log('Shower hinged:', sh5.title);
console.log('Shower sliding:', sh5s.title);

const pkgsBp = api.buildPackages(bp);
allOk = expect('black profile cards (sliding only ×4)', pkgsBp.length, 4) && allOk;
allOk = pkgsBp.every((p) => p.size.h === 7) && allOk;
allOk = /Half-Half/.test(pkgsBp[0].title) && allOk;

// Coverage: aluminium-windows + shower-partitions pages with data-product
function listHtml(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) out.push(...listHtml(full));
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}
const winPages = listHtml(path.join(ROOT, 'products', 'aluminium-windows')).filter((f) =>
  /data-product\s*=/.test(fs.readFileSync(f, 'utf8'))
);
const showerPages = listHtml(path.join(ROOT, 'products', 'shower-partitions')).filter((f) =>
  /data-product\s*=/.test(fs.readFileSync(f, 'utf8'))
);
allOk = expect('window pages with data-product', winPages.length > 0, true) && allOk;
allOk = expect('shower pages with data-product', showerPages.length > 0, true) && allOk;
console.log('Window calc pages:', winPages.length, '| Shower calc pages:', showerPages.length);

const ux = fs.readFileSync(path.join(ROOT, 'js', 'calculator-mobile-ux.js'), 'utf8');
allOk = /loadStandardSizePackages/.test(ux) && /standard-size-packages\.js/.test(ux) && allOk;
allOk = fs.existsSync(path.join(ROOT, 'css', 'standard-size-packages.css')) && allOk;

console.log(allOk ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(allOk ? 0 : 1);
