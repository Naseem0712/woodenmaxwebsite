#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');

const FROZEN_CSS = '2DD71ADBE241306C44D2B876CBC22D4D309E68A6AC1BEEC5332B3B2C7C7AC081';
const FROZEN_JS = '5AFE998D8B3A6C058E1F7002367C40E493A62D97432BBB0E3F9C7FC7979DD57D';

function sha256(rel) {
  const buf = fs.readFileSync(path.join(root, rel));
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

function checkPage(rel, expect) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  const issues = [];
  const count = (re) => (html.match(re) || []).length;
  if (!html.includes('data-product-page-layout="gallery-first"')) issues.push('missing gallery-first');
  if (!html.includes('wm-product-pilot-flow')) issues.push('missing pilot flow');
  if (!html.includes('wm-product-pilot-gallery')) issues.push('missing pilot gallery');
  if (!html.includes('wm-product-pilot-calculator-column')) issues.push('missing calc column');
  if (!html.includes('wm-product-pilot-identity')) issues.push('missing identity');
  if (!html.includes('wm-product-pilot-context')) issues.push('missing context');
  if (count(/>Calculator Finder</g) !== 1) issues.push('finder count=' + count(/>Calculator Finder</g));
  if (html.includes('floating-calc-button')) issues.push('floating calc present');
  if (!html.includes('product-page-pilot.css?v=20260824c')) issues.push('pilot css missing/wrong ver');
  if (!html.includes('product-page-pilot.js?v=20260824c')) issues.push('pilot js missing/wrong ver');
  if (count(/data-product-pilot-source/g) < 2) issues.push('sources < 2');
  if (expect.h1 && !html.includes(expect.h1Snippet)) issues.push('h1 snippet missing');
  if (expect.canonical && !html.includes(`rel="canonical" href="${expect.canonical}"`)) issues.push('canonical mismatch');
  if (expect.product && !html.includes(`data-product="${expect.product}"`)) issues.push('product mismatch');
  if (expect.pkg && !html.includes(`data-product-id="${expect.pkg}"`)) issues.push('pkg mismatch');
  if (!html.includes('id="wm-standard-packages"')) issues.push('packages missing');
  if (!html.includes('wm-std-pkg-jsonld')) issues.push('Offer jsonld missing');
  return { rel, ok: issues.length === 0, issues };
}

assert.equal(sha256('css/product-page-pilot.css'), FROZEN_CSS, 'pilot CSS mutated');
assert.equal(sha256('js/product-page-pilot.js'), FROZEN_JS, 'pilot JS mutated');

const results = [
  checkPage('products/aluminium-windows/2-track-french-sliding-door.html', {
    h1Snippet: '2 Track Aluminium Sliding Door',
    canonical: 'https://woodenmax.in/products/aluminium-windows/2-track-french-sliding-door',
    product: '2track-french',
    pkg: '2track-french',
  }),
  checkPage('products/aluminium-windows/top-hung-casement-window.html', {
    h1Snippet: 'Top Hung Casement Window',
    canonical: 'https://woodenmax.in/products/aluminium-windows/top-hung-casement-window',
    product: 'top-hung-casement',
    pkg: 'top-hung-casement',
  }),
  checkPage('products/glass-railing/balcony-glass-railing.html', {
    h1Snippet: 'Balcony Frameless Glass Railing',
    canonical: 'https://woodenmax.in/products/glass-railing/balcony-glass-railing',
    product: 'glass-railing-balcony',
    pkg: 'glass-railing-balcony',
  }),
  checkPage('products/shower-partitions/frosted-glass-bathroom-door.html', {
    h1Snippet: 'Fold &amp; Slide Frosted Glass Bathroom Door',
    canonical: 'https://woodenmax.in/products/shower-partitions/frosted-glass-bathroom-door',
    product: 'frosted-glass-bathroom-door',
    pkg: 'frosted-glass-bathroom-door',
  }),
];

for (const r of results) {
  console.log(r.ok ? 'PASS' : 'FAIL', r.rel, r.issues.join('; ') || 'ok');
}
if (results.some((r) => !r.ok)) process.exit(1);
console.log('PASS: Batch 1B static contract');
