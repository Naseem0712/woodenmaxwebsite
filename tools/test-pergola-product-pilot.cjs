#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'products/pergola/aluminium-pergola.html');
const html = fs.readFileSync(file, 'utf8');
const rates = JSON.parse(fs.readFileSync(path.join(root, 'data/rates.json'), 'utf8'));
const model = require(path.join(root, 'js/pricing/pricing-models.js'));

function count(pattern) {
  return (html.match(pattern) || []).length;
}

assert(!/<<<<<<<|=======|>>>>>>>/.test(html), 'merge markers must not remain');
assert(html.includes('data-product-page-layout="gallery-first"'), 'the Reference v1 layout must be enabled');
assert.equal(count(/>Calculator Finder</g), 1, 'the page must expose one Calculator Finder control');
assert.equal(count(/class="thumbnail-item/g), 6, 'the gallery must expose six thumbnails');
assert(html.includes('id="product-main-image"'), 'the gallery must expose a primary image');
assert(html.includes('loading="eager" fetchpriority="high" id="product-main-image"'), 'the LCP image must remain eager and high priority');
assert(html.includes('id="product-pricing-root" class="wm-product-pilot-calculator"'), 'the calculator must use the shared pilot placement');
assert(html.includes('/js/pricing/pricing-models.js'), 'the canonical pricing model must load');
assert(html.includes('/js/pergola-product-pricing.js?v=20260826p1'), 'the cache-versioned Pergola calculator must load');
assert(html.includes('/js/standard-size-packages.js?v=20260826p1'), 'the cache-versioned package controller must load');
assert(html.includes('/js/product-page-pilot.js?v=20260826p1'), 'the cache-versioned shared pilot controller must load');
assert(html.includes('/js/site-nav.js?v=20260801s1'), 'site nav must load for header chrome');
assert(html.includes('/js/site-footer.js?v=20260801s1'), 'site footer must load');
assert(html.includes('wm-product-pilot-calculator-lead'), 'calculator lead must be a direct pilot grid participant');
assert(!/wm-product-pilot-calculator-column[^>]*>[\s\S]*class="[^"]*wm-product-pilot-calculator-column/.test(html), 'calculator column must not nest another calculator column');

const section = html.match(/<section[^>]+id="wm-standard-packages-pergola"[\s\S]*?<\/section>/)?.[0] || '';
assert(section, 'the crawlable Pergola SSR package section must exist');
assert.equal(count(/data-pricing-revision="wm1-om7s85"/g), 1, 'the SSR pricing revision must match the canonical source');
assert.equal((section.match(/class="wm-std-pkg-card"/g) || []).length, 18, 'the SSR section must retain 18 package cards');
assert(fs.readFileSync(path.join(root, 'js/product-page-pilot.js'), 'utf8').includes('.wm-std-pkg[data-product-id]'), 'shared pilot must discover product-specific SSR package sections');

const offers = JSON.parse(html.match(/<script type="application\/ld\+json" id="wm-std-pkg-jsonld">([\s\S]*?)<\/script>/)?.[1] || '{}').itemListElement || [];
const cardAmounts = [...section.matchAll(/data-package-price data-price="(\d+)" data-amount="(\d+)"/g)].map((m) => Number(m[1]));
assert.equal(offers.length, 18, 'the Offer list must retain 18 entries');
assert.equal(cardAmounts.length, 18, 'the card list must retain 18 prices');

const expected = [
  [10, 10, 9], [10, 10, 9.5], [10, 10, 10],
  [12, 12, 9], [12, 12, 9.5], [12, 12, 10],
  [12, 15, 9], [12, 15, 9.5], [12, 15, 10],
  [15, 25, 9], [15, 25, 9.5], [15, 25, 10],
  [35, 45, 9], [35, 45, 9.5], [35, 45, 10],
  [6, 25, 9], [6, 25, 9.5], [6, 25, 10]
].map(([width, depth, clearanceFt]) => model.roundedINR(model.pergola(rates, {
  width, depth, clearanceFt, lineId: 'fixed_aluminium_glass', roof: '10mm_clr', coating: 'plain'
})));

assert.deepEqual(cardAmounts, expected, 'all cards must match the canonical width/depth/clearance/coating model');
assert.deepEqual(offers.map((item) => Number(item.item.price)), expected, 'all Offers must match the canonical width/depth/clearance/coating model');

console.log('PASS: Pergola Reference v1 static and canonical pricing contract');
