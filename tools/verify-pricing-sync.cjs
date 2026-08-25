#!/usr/bin/env node
'use strict';
/* Contract verifier: approved data -> canonical record -> SSR card -> Offer. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const productsData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8'));
const rates = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rates.json'), 'utf8'));
const model = require(path.join(ROOT, 'js/pricing/pricing-models.js'));
const products = new Map((productsData.products || []).map((p) => [p.id, p]));
const ctx = { window: null, document: { readyState:'complete', addEventListener(){}, querySelectorAll(){return[]}, getElementById(){return null}, createElement(){return {setAttribute(){},appendChild(){},style:{}}}, head:{appendChild(){}} }, location:{href:'https://woodenmax.in/',pathname:'/'}, setTimeout, clearTimeout, fetch:undefined };
ctx.window = ctx;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/pricing/pricing-models.js'), 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/standard-size-packages.js'), 'utf8'), ctx);
const api = ctx.WMStandardPackages;
api.setRates(rates);
let failures = 0;
function check(ok, text) { if (ok) console.log('PASS', text); else { console.error('FAIL', text); failures++; } }
function page(rel, productId, sectionId, kind) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const p = productId ? products.get(productId) : { id:'pergola-fixed_aluminium_glass', category:'pergola' };
  const records = kind === 'pergola' ? api.buildPergolaGlassPackages(rates, 'fixed_aluminium_glass') : api.buildPackages(p);
  const sectionMatch = html.match(new RegExp('<section[^>]+id=["\']' + sectionId + '["\'][\\s\\S]*?</section>'));
  check(!!sectionMatch, rel + ' SSR section exists');
  if (!sectionMatch) return;
  const section = sectionMatch[0];
  const visible = [...section.matchAll(/data-package-price[^>]*data-price="(\d+)"[^>]*data-amount="(\d+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
  const jsonText = (html.match(/<script type="application\/ld\+json" id="wm-std-pkg-jsonld">([\s\S]*?)<\/script>/) || [])[1];
  let offers = [];
  try { offers = JSON.parse(jsonText).itemListElement.map((x) => Number(x.item.price)); } catch (error) { check(false, rel + ' Offer JSON-LD parses'); }
  check(records.length === visible.length && visible.length === offers.length, rel + ' record/card/Offer count equality');
  records.forEach((record, index) => {
    const amount = model.roundedINR(record.amount);
    const card = visible[index] || [];
    check(amount === card[0] && amount === card[1] && amount === offers[index], rel + ' #' + (index + 1) + ' canonical/card/Offer ₹' + amount);
  });
  const expectedRevision = kind === 'pergola' ? model.revisionFor('pergola', rates, {lineId:'fixed_aluminium_glass'}) : model.revisionFor(kind, p);
  const actualRevision = (section.match(/data-pricing-revision="([^"]+)"/) || [])[1];
  check(expectedRevision === actualRevision, rel + ' verified SSR revision');
}
function noFallbacks() {
  const scans = [
    ['js/calculator/configs.js', /this\.getFallbackData\s*\(/],
    ['js/calculator/extensions/3track-sliding.js', /TRACK_RATES\s*=.*\|\||GLASS_RATES\s*=.*\|\|/],
    ['js/calculator/extensions/frameless-shower.js', /HINGED_GLASS_RATE.*\|\||SLIDING_GLASS_RATE.*\|\|/],
    ['js/standard-size-packages.js', /base_pergola_per_sqft\)\s*\|\||10mm_clr'\]\)\s*\|\||coating_price.*\|\|/],
    ['js/pergola-product-pricing.js', /base_pergola_per_sqft\s*\|\|\s*850/]
  ];
  scans.forEach(([rel, pattern]) => check(!pattern.test(fs.readFileSync(path.join(ROOT, rel), 'utf8')), rel + ' has no active monetary fallback'));
}
function simulation() {
  const p3 = JSON.parse(JSON.stringify(products.get('3track-sliding')));
  const sh = JSON.parse(JSON.stringify(products.get('frameless-shower-partition')));
  const pg = JSON.parse(JSON.stringify(rates));
  const before3 = model.threeTrack(p3,{width:5,height:4,track:'3track',glassMm:6}); p3.rates.baseRate += 10;
  check(model.threeTrack(p3,{width:5,height:4,track:'3track',glassMm:6}) - before3 === 200, 'simulation 3-track +₹10/sqft propagates +₹200');
  const beforeS = model.framelessShower(sh,{width:5,height:7,mode:'hinged',finish:'mill-finish'}); sh.rates.hinged.glassRate += 10;
  check(model.framelessShower(sh,{width:5,height:7,mode:'hinged',finish:'mill-finish'}) - beforeS === 350, 'simulation shower +₹10/sqft propagates +₹350');
  const beforeP = model.pergola(pg,{width:10,depth:10,clearanceFt:9}); pg.pergola_catalog.lines.find((x)=>x.id==='fixed_aluminium_glass').aluminium_structure_per_sqft += 10;
  check(model.pergola(pg,{width:10,depth:10,clearanceFt:9}) - beforeP === 1000, 'simulation pergola +₹10/sqft propagates +₹1,000');
  const diff = cp.spawnSync('git', ['diff', '--quiet', '--', 'data/products.json', 'data/rates.json'], {cwd:ROOT, stdio:'ignore'});
  check(diff.status === 0, 'simulation left approved source JSON unchanged');
}
check(Array.isArray(productsData.products) && products.has('3track-sliding') && products.has('frameless-shower-partition'), 'authoritative product source integrity');
check(rates.pergola_catalog && Array.isArray(rates.pergola_catalog.lines), 'authoritative pergola source integrity');
noFallbacks();
page('products/aluminium-windows/3-track-sliding-window.html', '3track-sliding', 'wm-standard-packages', '3track');
page('products/shower-partitions/frameless-shower-partition.html', 'frameless-shower-partition', 'wm-standard-packages', 'frameless-shower');
page('products/pergola/aluminium-pergola.html', null, 'wm-standard-packages-pergola', 'pergola');
simulation();
if (failures) process.exitCode = 1;
