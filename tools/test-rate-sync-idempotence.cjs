#!/usr/bin/env node
'use strict';
const cp = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
function run() { return cp.execFileSync(process.execPath, ['tools/sync-package-rates-html.cjs'], { cwd: ROOT, encoding: 'utf8' }); }
const first = run();
const second = run();
if (!/Updated:\s*0\s+pages/.test(second)) {
  console.error(second);
  throw new Error('Second rates:sync was not idempotent.');
}
console.log('PASS rates:sync idempotence; second run updated 0 pages.');
console.log(first.match(/Updated:\s*\d+\s+pages/)?.[0] || 'First run completed.');
