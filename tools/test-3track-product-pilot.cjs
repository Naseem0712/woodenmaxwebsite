#!/usr/bin/env node

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'products', 'aluminium-windows', '3-track-sliding-window.html');
const cssPath = path.join(root, 'css', 'product-page-pilot.css');
const scriptPath = path.join(root, 'js', 'product-page-pilot.js');
const page = fs.readFileSync(pagePath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const script = fs.readFileSync(scriptPath, 'utf8');

function count(pattern) {
  return (page.match(pattern) || []).length;
}

assert.match(page, /<link rel="canonical" href="https:\/\/woodenmax\.in\/products\/aluminium-windows\/3-track-sliding-window"/);
assert.match(page, /<title>3 Track Aluminium Sliding Window with Mesh Price/);
assert.match(page, /<h1[^>]*>Aluminium 3 Track Sliding Window with Mesh<\/h1>/);
assert.match(page, /data-product="3track-sliding"/);
assert.match(page, /id="price-calculator-3track-sliding"/);
assert.match(page, /id="wm-standard-packages"[^>]*data-product-id="3track-sliding"/);
assert.match(page, /data-product-page-layout="gallery-first"/);
assert.match(page, /href="\/css\/product-page-pilot\.css\?v=20260824c"/);
assert.match(page, /href="\/css\/product-image-gallery\.css\?v=20260801s1"/);
assert.match(page, /src="\/js\/product-page-pilot\.js\?v=20260824c"/);
assert.match(page, /src="\/js\/product-image-gallery\.js\?v=20260801s1"/);
assert.equal(count(/>Calculator Finder</g), 1, 'the pilot must expose one Calculator Finder control');
assert.equal(count(/data-product-pilot-source/g), 2, 'the technical source blocks must feed the shared accordion');
assert.match(page, /loading="eager" fetchpriority="high" id="product-main-image"/);
assert.match(page, /width="1024"\s+height="1024"\s+class="product-main-image"/);
assert.match(css, /aspect-ratio: 1 \/ 1/);
assert.doesNotMatch(css, /3track|3-track|mesh/i, 'shared CSS must not encode 3-track product logic');
assert.doesNotMatch(script, /3track|3-track|mesh/i, 'shared JS must not encode 3-track product logic');
assert.doesNotMatch(page, /class="floating-calc-button"/);

execFileSync(process.execPath, ['--check', scriptPath], { stdio: 'inherit' });
console.log('PASS: 3-track product-page pilot static contract');
