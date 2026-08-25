#!/usr/bin/env node
'use strict';
/* Regression fixtures derive their expected values from approved JSON. They
 * intentionally do not provide production pricing inputs. */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8')).products;
const rates = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rates.json'), 'utf8'));
const model = require(path.join(ROOT, 'js/pricing/pricing-models.js'));
const product = (id) => { const p = products.find((item) => item.id === id); if (!p) throw new Error('Missing product ' + id); return p; };
const p3 = product('3track-sliding');
const shower = product('frameless-shower-partition');
const fixtures = [
  ['3-track 5×4 2-track 6mm', () => { const r=p3.rates; return (r.baseRate + r.glass['6mm']) * 5 * 4 + r.hardwareCost; }, () => model.threeTrack(p3, { width:5, height:4, track:'2track', glassMm:6 })],
  ['3-track 5×4 3-track 6mm', () => { const r=p3.rates; return (r.baseRate + r.trackOptions['3track'] + r.glass['6mm']) * 5 * 4 + r.hardwareCost; }, () => model.threeTrack(p3, { width:5, height:4, track:'3track', glassMm:6 })],
  ['3-track 6×6 3-track 6mm', () => { const r=p3.rates; return (r.baseRate + r.trackOptions['3track'] + r.glass['6mm']) * 6 * 6 + r.hardwareCost; }, () => model.threeTrack(p3, { width:6, height:6, track:'3track', glassMm:6 })],
  ['Shower 4×7 hinged', () => 4*7*shower.rates.hinged.glassRate + shower.rates.hinged.hardware['mill-finish'], () => model.framelessShower(shower, { width:4,height:7,mode:'hinged',finish:'mill-finish' })],
  ['Shower 5×7 hinged', () => 5*7*shower.rates.hinged.glassRate + shower.rates.hinged.hardware['mill-finish'], () => model.framelessShower(shower, { width:5,height:7,mode:'hinged',finish:'mill-finish' })],
  ['Shower 5×7 sliding', () => 5*7*shower.rates.sliding.glassRate + shower.rates.sliding.hardware['mill-finish'], () => model.framelessShower(shower, { width:5,height:7,mode:'sliding',finish:'mill-finish' })],
  ['Pergola 10×10 / 9 ft', () => { const l=rates.pergola_catalog.lines.find(x=>x.id==='fixed_aluminium_glass'); return 10*10*(l.aluminium_structure_per_sqft+rates.glass_unit_rates_per_sqft['10mm_clr']+rates.coating_price.plain)*(9/9); }, () => model.pergola(rates,{width:10,depth:10,clearanceFt:9})],
  ['Pergola 12×12 / 9.5 ft', () => { const l=rates.pergola_catalog.lines.find(x=>x.id==='fixed_aluminium_glass'); return 12*12*(l.aluminium_structure_per_sqft+rates.glass_unit_rates_per_sqft['10mm_clr']+rates.coating_price.plain)*(9.5/9); }, () => model.pergola(rates,{width:12,depth:12,clearanceFt:9.5})],
  ['Pergola 12×15 / 10 ft', () => { const l=rates.pergola_catalog.lines.find(x=>x.id==='fixed_aluminium_glass'); return 12*15*(l.aluminium_structure_per_sqft+rates.glass_unit_rates_per_sqft['10mm_clr']+rates.coating_price.plain)*(10/9); }, () => model.pergola(rates,{width:12,depth:15,clearanceFt:10})]
];
let failed = 0;
for (const [name, expectedFn, actualFn] of fixtures) {
  const expected = model.round2(expectedFn()); const actual = actualFn();
  if (expected !== actual) { failed++; console.error('FAIL', name, expected, actual); } else console.log('PASS', name, '₹' + model.roundedINR(actual));
}
for (const [name, fn] of [
  ['3-track rejects missing rate data', () => model.threeTrack({ rates: {} }, { width: 5, height: 4, track: '2track', glassMm: 6 })],
  ['shower rejects missing rate data', () => model.framelessShower({ rates: {} }, { width: 5, height: 7, mode: 'hinged', finish: 'mill-finish' })],
  ['pergola rejects missing rate data', () => model.pergola({}, { width: 10, depth: 10, clearanceFt: 9 })]
]) {
  try { fn(); failed++; console.error('FAIL', name); }
  catch (error) { console.log('PASS', name); }
}
if (failed) process.exitCode = 1;
