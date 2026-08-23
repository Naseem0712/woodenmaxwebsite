#!/usr/bin/env node

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'products', 'shower-partitions', 'frameless-shower-partition.html');
const cssPath = path.join(root, 'css', 'product-page-pilot.css');
const scriptPath = path.join(root, 'js', 'product-page-pilot.js');
const page = fs.readFileSync(pagePath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const script = fs.readFileSync(scriptPath, 'utf8');

function count(pattern) {
  return (page.match(pattern) || []).length;
}

assert.match(page, /<link rel="canonical" href="https:\/\/woodenmax\.in\/products\/shower-partitions\/frameless-shower-partition"/);
assert.match(page, /<title>Frameless Shower Price India \(2026\) — Walk-in Glass Enclosure ₹440–1,320\/sqft \| WoodenMax<\/title>/);
assert.match(page, /<meta property="og:url" content="https:\/\/woodenmax\.in\/products\/shower-partitions\/frameless-shower-partition"/);
assert.match(page, /<meta property="og:title" content="Frameless Shower Price India \(2026\) — Walk-in Glass Enclosure \| WoodenMax"/);
assert.match(page, /<h1[^>]*>Frameless Shower Price — Walk-in Glass Enclosure/);
assert.match(page, /data-product="frameless-shower-partition"/);
assert.match(page, /id="price-calculator-frameless-shower-partition"/);
assert.match(page, /id="wm-standard-packages"[^>]*data-product-id="frameless-shower-partition"/);
assert.match(page, /"@type": "Product"[\s\S]*?"name": "Frameless Shower — Walk-in Glass Enclosure"/);
assert.match(page, /"url": "https:\/\/woodenmax\.in\/products\/shower-partitions\/frameless-shower-partition"/);
assert.match(page, /data-product-page-layout="gallery-first"/);
assert.match(page, /href="\/css\/product-page-pilot\.css\?v=20260824c"/);
assert.match(page, /href="\/css\/product-image-gallery\.css\?v=20260801s1"/);
assert.match(page, /src="\/js\/product-page-pilot\.js\?v=20260824c"/);
assert.match(page, /src="\/js\/product-image-gallery\.js\?v=20260801s1"/);
assert.equal(count(/>Calculator Finder</g), 1, 'the pilot must expose one Calculator Finder control');
assert.equal(count(/data-product-pilot-source/g), 2, 'the gallery detail blocks must feed the shared accordion');
assert.match(page, /data-product-pilot-technical-specs/);
assert.match(page, /loading="eager" fetchpriority="high" id="product-main-image"/);
assert.match(page, /Technical Specifications/);
assert.doesNotMatch(page, /class="floating-calc-button"/);
assert.match(css, /aspect-ratio: 1 \/ 1/);
assert.doesNotMatch(css, /frameless|shower-partition|shower glass/i, 'shared CSS must not encode shower-specific product logic');
assert.doesNotMatch(script, /frameless|shower-partition|shower glass/i, 'shared JS must not encode shower-specific product logic');

execFileSync(process.execPath, ['--check', scriptPath], { stdio: 'inherit' });
console.log('PASS: frameless shower product-page pilot static contract');
