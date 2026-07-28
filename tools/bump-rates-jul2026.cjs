/**
 * Bump calculator rates:
 *   - Domal (3track-sliding) → +20%
 *   - Glass + all other money rates → +10%
 *
 * Run: node tools/bump-rates-jul2026.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOMAL_ID = '3track-sliding';
const DOMAL_MULT = 1.2;
const OTHER_MULT = 1.1;

/** Keys that are never money (dimensions, multipliers, weights, counts). */
const SKIP_KEY = new Set([
  'multiplier',
  'wastage',
  'defaultGlassCount',
  'minWidth',
  'maxHeight',
  'max_height_inch',
  'max_length_ft',
  'gstPercent',
  'spacing_ft',
  'gap_mm',
  'pitch_mm',
  'wall_mm',
  'mm',
  'w_ft',
  'h_ft',
  'sqft',
  'sqft_per_sheet',
  'density_kg_per_m3',
  'kg_per_sqft_per_mm',
  'reference_sheet_8x4_1mm_kg',
  'weight_kg_per_rft',
  'weight_kg_per_sqft',
  'weight_kg_per_pc',
  'iron_kg_per_sqft',
  'length_ft_per_pc',
  'blade_gap_mm',
  'thickness_mm',
  'band_inch_1_1_5mm',
  'chemical_bottle_per_15_fasteners',
  'dispatchWorkingDays',
  'coating_same_as_ceiling',
]);

const SKIP_KEY_RE =
  /^(weight|weights|density|gap_|pitch_|wall_|blade_|spacing|max_|min_|multiplier|wastage|defaultGlass|sheet_size|standard_lengths|warranty|dispatch)/i;

const MONEY_KEY_RE =
  /(rate|price|cost|coating|baseRate|hardwareCost|base_|per_sqft|per_rft|per_pc|per_door|per_kg|per_foot|glass|mesh|lock|grill|track|panelConfig|fluted|premiumColor|profile|structure|installation|perforation|package_rate|pillar|stud|handrail|fastener|chemical_bottle_rate|deco_paint|steel_rate|aluminium_rate|iron_rate|polycarbonate|laminated|dgu|touch|driver|packing|v120|v220|bevel|led|motion|slimPremium|profileAdd|touchPc|motionPerGlass|min|max)$|^(min|max)$/i;

/** Parent keys whose child numeric maps are money (e.g. package_rate_per_sqft["2"]). */
const MONEY_PARENT_RE =
  /(rate|price|cost|coating|base_per|per_sqft|per_rft|per_pc|per_door|per_kg|package_rate|structure_per|perforation|installation|hardwareCost|baseRate|panelConfig|flutedGlass|premiumColors|profiles|glass|mesh|lock|grill|trackOptions|openable|sliding|frame|calculators|profilePerFoot|unitProducts|hardware)$/i;

/** Parent keys whose child maps are NOT money (weights by thickness etc.). */
const NON_MONEY_PARENT_RE = /^(weight|weights|density|thickness_multiplier|wall_thickness|glass_sheet|aluminum_sheet|sheet_sizes|standard_lengths)/i;

function isSkipKey(key) {
  return SKIP_KEY.has(key) || SKIP_KEY_RE.test(key);
}

function roundMoney(n) {
  const r = Math.round(n * 10000) / 10000;
  return Object.is(r, -0) ? 0 : r;
}

function bumpValue(n, mult) {
  if (n === 0) return 0;
  return roundMoney(n * mult);
}

function shouldBumpNumber(key, parentKey) {
  if (isSkipKey(key)) return false;
  if (parentKey && NON_MONEY_PARENT_RE.test(parentKey)) return false;
  // Numeric-looking keys ("2", "1.2", "6mm") — only if parent is a money map
  if (/^[\d.]+/.test(key) || /mm_/.test(key) || /_clr|_color|_fluted/.test(key)) {
    return parentKey ? MONEY_PARENT_RE.test(parentKey) || /glass|laminated|dgu|coating|rate|price|cost|base/i.test(parentKey) : false;
  }
  // Named money keys
  if (MONEY_KEY_RE.test(key) || /Rate|Cost|Price|Extra|Upgrade|packing|v120|v220|bevel|touchPc|motionPerGlass|slimPremium|profileAdd|ledV/.test(key)) {
    return true;
  }
  // Common product rate field names
  if (
    [
      'baseRate',
      'hardwareCost',
      'hardwareCostMultiPoint',
      'standard',
      'openable',
      'security',
      'wooden',
      'plain',
      'textured',
      'singlePoint',
      'multiPoint',
      'mortice',
      'aluminium12mm',
      '2track',
      '3track',
      'dgu',
      'laminated',
      'safety',
      '6mm',
      '8mm',
      '10mm',
      '12mm',
      '5mm',
    ].includes(key)
  ) {
    return true;
  }
  return false;
}

function walk(obj, mult, parentKey = '') {
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'number') return item; // sheet size arrays etc.
      return walk(item, mult, parentKey);
    });
  }
  const out = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'number') {
      out[key] = shouldBumpNumber(key, parentKey) ? bumpValue(val, mult) : val;
    } else if (val && typeof val === 'object') {
      out[key] = walk(val, mult, key);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function bumpProducts(data) {
  data.globalRates = walk(data.globalRates, OTHER_MULT, 'globalRates');
  data.products = data.products.map((p) => {
    const mult = p.id === DOMAL_ID ? DOMAL_MULT : OTHER_MULT;
    if (!p.rates) return p;
    return { ...p, rates: walk(p.rates, mult, 'rates') };
  });
  return data;
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// --- products.json ---
const productsPath = path.join(ROOT, 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const domalBefore = products.products.find((p) => p.id === DOMAL_ID);
console.log('Domal before:', JSON.stringify(domalBefore?.rates));
const productsAfter = bumpProducts(structuredClone(products));
const domalAfter = productsAfter.products.find((p) => p.id === DOMAL_ID);
console.log('Domal after:', JSON.stringify(domalAfter?.rates));
console.log('global glass 8mm before/after:', products.globalRates.glass['8mm'], '→', productsAfter.globalRates.glass['8mm']);
console.log('29mm base before/after:', products.products[0].rates.baseRate, '→', productsAfter.products[0].rates.baseRate);
writeJson(productsPath, productsAfter);

// --- rates.json ---
const ratesPath = path.join(ROOT, 'data', 'rates.json');
const rates = JSON.parse(fs.readFileSync(ratesPath, 'utf8'));
const g6 = rates.glass_unit_rates_per_sqft?.['6mm_clr'];
const tmBefore = { ...rates.thickness_multiplier };
const wBefore = rates.glass_railing?.bottom_rails?.[0]?.weight_kg_per_rft;
const ratesAfter = walk(structuredClone(rates), OTHER_MULT, 'rates');
// Force-restore thickness multipliers
ratesAfter.thickness_multiplier = tmBefore;
console.log('glass 6mm_clr:', g6, '→', ratesAfter.glass_unit_rates_per_sqft?.['6mm_clr']);
console.log('thickness_multiplier unchanged:', JSON.stringify(ratesAfter.thickness_multiplier));
console.log('weight unchanged:', wBefore, '→', ratesAfter.glass_railing?.bottom_rails?.[0]?.weight_kg_per_rft);
console.log('bottom rail rate:', rates.glass_railing?.bottom_rails?.[0]?.rate_per_rft, '→', ratesAfter.glass_railing?.bottom_rails?.[0]?.rate_per_rft);
writeJson(ratesPath, ratesAfter);

// --- mirror.json ---
const mirrorPath = path.join(ROOT, 'data', 'mirror.json');
const mirror = JSON.parse(fs.readFileSync(mirrorPath, 'utf8'));
const mirrorAfter = walk(structuredClone(mirror), OTHER_MULT, 'mirror');
// Restore meta non-money
if (mirror.meta) mirrorAfter.meta = mirror.meta;
if (mirror.pageCalculator) mirrorAfter.pageCalculator = mirror.pageCalculator;
console.log('mirror half-round v120:', mirror.calculators?.['half-round']?.v120, '→', mirrorAfter.calculators?.['half-round']?.v120);
writeJson(mirrorPath, mirrorAfter);

// --- regenerate js/mirror-rates-data.js from rates.json ---
const mp = ratesAfter.mirror_profiles;
if (mp) {
  const payload = {
    hardware: mp.hardware,
    calculators: mp.calculators,
    profileColors: mp.profileColors,
  };
  const outPath = path.join(ROOT, 'js', 'mirror-rates-data.js');
  fs.writeFileSync(
    outPath,
    '/* Auto-generated from data/rates.json → mirror_profiles — run: node tools/build-catalog-seo-pages.cjs */\n' +
      'window.WM_MIRROR_RATES=' +
      JSON.stringify(payload) +
      ';\n',
    'utf8'
  );
  console.log('Updated js/mirror-rates-data.js');
} else {
  console.warn('No mirror_profiles section — skipped mirror-rates-data.js');
}

console.log('OK');
