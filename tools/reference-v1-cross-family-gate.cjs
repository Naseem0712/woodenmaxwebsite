#!/usr/bin/env node
'use strict';

/**
 * Reference Product Page v1 — cross-family regression gate.
 * Required before merging shared changes to product-page-pilot.css/js
 * or shared pricing / standard-package infrastructure.
 *
 * Contract: docs/REFERENCE_V1_FREEZE.md
 * Manifest: docs/reference-v1-freeze-manifest.json
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'docs', 'reference-v1-freeze-manifest.json');

if (!fs.existsSync(manifestPath)) {
  console.error('FAIL: missing freeze manifest at docs/reference-v1-freeze-manifest.json');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const suites = (manifest.crossFamilyGate && manifest.crossFamilyGate.requiredSuites) || [];

if (!suites.length) {
  console.error('FAIL: freeze manifest lists no requiredSuites');
  process.exit(1);
}

let failed = 0;

for (const rel of suites) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error('FAIL missing suite:', rel);
    console.error('  Checkout freeze tip', manifest.freezeTip && manifest.freezeTip.short, 'or restore the suite file.');
    failed += 1;
    continue;
  }

  console.log('\n===', rel, '===');
  const result = spawnSync(process.execPath, [abs], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error('FAIL suite:', rel, '(exit', result.status, ')');
    failed += 1;
  }
}

console.log('\n---');
if (failed) {
  console.error('FAIL: Reference v1 cross-family gate —', failed, 'suite(s) failed');
  console.error('Golden URLs:', (manifest.goldenReferences || []).map((g) => g.url).join(' | '));
  process.exit(1);
}

console.log('PASS: Reference v1 cross-family gate');
console.log('Freeze tip:', manifest.freezeTip && manifest.freezeTip.sha);
console.log('Viewport gates still required manually/browser:', (manifest.viewportGatesPx || []).join(', '), 'px');
