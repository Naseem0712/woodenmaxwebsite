/**
 * Plan verification — Standard Size Package Cards (Windows + Showers core)
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8'));
const g = products.globalRates;
const ctx = {
  window: null,
  document: {
    readyState: 'complete',
    addEventListener() {},
    querySelectorAll() { return []; },
    getElementById() { return null; },
    createElement() { return { setAttribute() {}, appendChild() {}, style: {} }; },
    head: { appendChild() {} },
    body: null
  },
  location: { href: 'https://woodenmax.in/', pathname: '/' },
  setTimeout,
  clearTimeout
};
ctx.window = ctx;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js', 'standard-size-packages.js'), 'utf8'), ctx);
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

function ok(label, cond) {
  console.log((cond ? 'OK  ' : 'FAIL') + ' ' + label);
  return !!cond;
}

let all = true;
const files = [
  'js/standard-size-packages.js',
  'css/standard-size-packages.css',
  'js/calculator-mobile-ux.js'
];
files.forEach((f) => {
  all = ok('exists ' + f, fs.existsSync(path.join(ROOT, f))) && all;
});

const ux = fs.readFileSync(path.join(ROOT, 'js', 'calculator-mobile-ux.js'), 'utf8');
all = ok('mobile-ux loads packages', /loadStandardSizePackages/.test(ux) && /standard-size-packages\.js/.test(ux)) && all;

const pkgSrc = fs.readFileSync(path.join(ROOT, 'js', 'standard-size-packages.js'), 'utf8');
all = ok('quote + buy actions', /pkg-quote/.test(pkgSrc) && /pkg-buy/.test(pkgSrc) && /WoodenMaxQuoteStore/.test(pkgSrc) && /openBookOrder/.test(pkgSrc)) && all;
all = ok('Try Custom Size', /pkg-custom/.test(pkgSrc)) && all;

const domal = products.products.find((p) => p.id === '3track-sliding');
const sliding = merge(products.products.find((p) => p.id === '29mm-sliding'));
const casement = merge(products.products.find((p) => p.id === 'top-hung-casement'));
const shower = products.products.find((p) => p.id === 'frameless-shower-partition');

const dPkgs = api.buildPackages(domal);
const sPkgs = api.buildPackages(sliding);
const cPkgs = api.buildPackages(casement);
const shPkgs = api.buildPackages(shower);

all = ok('Domal has 2-track + 3-track cards', dPkgs.length >= 2 && /2 Track/.test(dPkgs[0].title) && /3 Track/.test(dPkgs[1].title)) && all;
all = ok('Domal live amount > 0', dPkgs[0].amount > 0 && dPkgs[1].amount > dPkgs[0].amount) && all;
all = ok('29mm mesh variants', sPkgs.filter((p) => p.withMesh).length > 0 && sPkgs.filter((p) => !p.withMesh).length > 0) && all;
all = ok('29mm titles are not fake 3-track', sPkgs.every((p) => !/3 Track/.test(p.title))) && all;
all = ok('casement packages', cPkgs.length >= 7) && all;
all = ok('casement swing sizes', cPkgs.some((p) => p.kind === 'swing' && p.size.w === 1.5 && p.size.h === 3)) && all;
all = ok('frameless shower packages', shPkgs.length >= 4 && shPkgs.every((p) => p.size.h === 7)) && all;
all = ok('shower 10mm in title/specs', shPkgs.some((p) => /10mm/.test(p.title) || /10mm/.test(p.specs))) && all;

// Economy sizes present for Domal
const domalSizes = dPkgs.map((p) => p.size.w + 'x' + p.size.h);
all = ok('Domal includes 5x4', domalSizes.indexOf('5x4') >= 0) && all;

console.log(all ? '\nPLAN CHECKS PASSED' : '\nPLAN CHECKS FAILED');
process.exit(all ? 0 : 1);
