#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

const pages = [
  'products/aluminium-windows/2-track-french-sliding-door.html',
  'products/aluminium-windows/top-hung-casement-window.html',
  'products/glass-railing/balcony-glass-railing.html',
  'products/shower-partitions/frosted-glass-bathroom-door.html',
];

function extractOfferPrices(html) {
  const block = html.match(/id="wm-std-pkg-jsonld">([\s\S]*?)<\/script>/);
  if (!block) return [];
  const json = JSON.parse(block[1]);
  return (json.itemListElement || []).map((li) => Number(li.item.price));
}

function extractPkgSection(html) {
  return html.match(/id="wm-standard-packages"[\s\S]*?<\/section>/)?.[0] || '';
}

function cardCount(html) {
  return (html.match(/class="wm-std-pkg-card"/g) || []).length;
}

let ok = true;
for (const rel of pages) {
  const base = execFileSync('git', ['show', `origin/main:${rel}`], { cwd: root, encoding: 'utf8' });
  const work = fs.readFileSync(path.join(root, rel), 'utf8');

  const baseOffers = extractOfferPrices(base);
  const workOffers = extractOfferPrices(work);
  const baseCards = cardCount(base);
  const workCards = cardCount(work);
  const baseSection = extractPkgSection(base);
  const workSection = extractPkgSection(work);

  const product = (work.match(/id="price-calculator[^"]*"[^>]*data-product="([^"]+)"/) ||
    work.match(/data-product="([^"]+)"[^>]*class="price-calculator-container"/) || [])[1];
  const pkgId = (work.match(/id="wm-standard-packages"[^>]*data-product-id="([^"]+)"/) || [])[1];

  console.log('\n==', rel);
  console.log('product=', product, 'pkgId=', pkgId);
  console.log('cards', workCards, '(main', baseCards + ')', 'offers', workOffers.length, '(main', baseOffers.length + ')');

  if (pkgId !== product) {
    console.log('FAIL product/pkg identity mismatch');
    ok = false;
  }
  if (JSON.stringify(baseOffers) !== JSON.stringify(workOffers)) {
    console.log('FAIL Offer JSON-LD changed vs origin/main');
    ok = false;
  } else {
    console.log('PASS Offer JSON-LD unchanged vs origin/main');
  }
  if (baseSection !== workSection) {
    console.log('FAIL SSR package section changed vs origin/main');
    ok = false;
  } else {
    console.log('PASS SSR package section unchanged vs origin/main');
  }
  if (baseCards !== workCards) {
    console.log('FAIL card count changed vs origin/main');
    ok = false;
  } else {
    console.log('PASS card count unchanged vs origin/main');
  }

  for (const p of workOffers) {
    const rounded = Math.round(p);
    const inr = rounded.toLocaleString('en-IN');
    const found =
      workSection.includes(`data-pkg-amount="${p}"`) ||
      workSection.includes(`data-pkg-amount="${rounded}"`) ||
      workSection.includes('₹' + inr) ||
      workSection.includes('₹' + rounded) ||
      workSection.includes('₹ ' + inr) ||
      workSection.includes('₹ ' + rounded);
    if (found) {
      console.log('OK Offer', p, 'in SSR');
    } else {
      console.log('FAIL Offer', p, 'missing from SSR cards');
      ok = false;
    }
  }
}

if (!ok) {
  console.error('\nBATCH 1B OFFER EQUALITY: FAIL');
  process.exit(1);
}
console.log('\nBATCH 1B OFFER EQUALITY: PASS');
