/**
 * Smoke: stock-length master defaults (no Vite).
 * Run: node tools/_smoke-stock-length-defaults.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (rel) => readFileSync(join(root, rel), 'utf8');

const defaults = src('src/engine/profileStockDefaults.ts');
assert.match(defaults, /UPVC_DEFAULT_STOCK_LENGTH_M = 5\.8/);
assert.match(defaults, /ALUMINIUM_DEFAULT_STOCK_LENGTH_FT = 16/);
assert.match(defaults, /ALUMINIUM_DEFAULT_STOCK_LENGTH_FT \* FT_TO_M/);
assert.match(defaults, /export function ensureProfileStockLength/);
assert.match(defaults, /export function stockLengthAfterMaterialChange/);

const seed = src('src/data/seed.ts');
assert.match(seed, /from '\.\.\/engine\/profileStockDefaults'/);
assert.equal(
  (seed.match(/stockLengthM: defaultStockLengthM\('UPVC'\)/g) || []).length,
  9,
);
assert.equal(
  (seed.match(/stockLengthM: defaultStockLengthM\('Aluminium'\)/g) || []).length,
  5,
);
assert.doesNotMatch(seed, /material: 'Aluminium'[^\\n]*stockLengthM: 5\.8/);

const ctx = src('src/store/AppContext.tsx');
assert.match(ctx, /ensureProfileStockLength/);
assert.match(ctx, /never wipe vendor custom lengths/);

const profiles = src('src/pages/settings/Profiles.tsx');
assert.match(profiles, /defaultStockLengthM\('UPVC'\)/);
assert.match(profiles, /stockLengthAfterMaterialChange/);

const lists = src('src/engine/deliverableLists.ts');
assert.match(lists, /from '\.\/profileStockDefaults'/);
assert.doesNotMatch(lists, /: 5\.8/);
assert.match(lists, /defaultStockLengthM\(/);

// Crash guard still present on tip
const exportDocs = src('src/engine/exportDocs.ts');
assert.match(exportDocs, /export function buildHardwareProfileBoqDocument/);

console.log(
  JSON.stringify(
    {
      ok: true,
      upvcDefaultM: 5.8,
      aluminiumDefaultFt: 16,
      aluminiumDefaultM: 16 * 0.3048,
      crashExportPresent: true,
    },
    null,
    2,
  ),
);
