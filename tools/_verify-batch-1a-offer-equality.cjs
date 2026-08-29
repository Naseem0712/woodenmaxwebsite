#!/usr/bin/env node
/**
 * Batch 1A Offer/card/JSON-LD equality for migrated pages.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

const pages = [
  'products/shower-partitions/black-profile-shower-partition.html',
  'products/shower-partitions/premium-black-profile-shower.html',
  'products/shower-partitions/slim-frame-shower-partition.html',
  'products/aluminium-windows/aluminium-sliding-window.html',
];

function extractCardPrices(html) {
  const prices = [];
  const re = /data-pkg-amount="(\d+(?:\.\d+)?)"/g;
  let m;
  while ((m = re.exec(html))) prices.push(Number(m[1]));
  // fallback: visible total in card
  if (!prices.length) {
    const re2 = /wm-std-pkg-amount[^>]*>\s*₹\s*([\d,]+)/g;
    while ((m = re2.exec(html))) prices.push(Number(m[1].replace(/,/g, '')));
  }
  return prices;
}

function extractOfferPrices(html) {
  const block = html.match(/id="wm-std-pkg-jsonld">([\s\S]*?)<\/script>/);
  if (!block) return [];
  const json = JSON.parse(block[1]);
  return (json.itemListElement || []).map((li) => Number(li.item.price));
}

function extractVisibleCardTotals(html) {
  const prices = [];
  const re = /class="wm-std-pkg-price"[^>]*>\s*₹\s*([\d,]+)/g;
  let m;
  while ((m = re.exec(html))) prices.push(Number(m[1].replace(/,/g, '')));
  if (!prices.length) {
    const re2 = /wm-std-pkg-total[^>]*>[\s\S]*?₹\s*([\d,]+)/g;
    while ((m = re2.exec(html))) prices.push(Number(m[1].replace(/,/g, '')));
  }
  // SSR often embeds as <strong>₹XX,XXX</strong> inside cards
  if (!prices.length) {
    const section = html.match(/id="wm-standard-packages"[\s\S]*?<\/section>/);
    if (section) {
      const re3 = /₹\s*([\d,]+)/g;
      while ((m = re3.exec(section[0]))) {
        const n = Number(m[1].replace(/,/g, ''));
        if (n >= 1000) prices.push(n);
      }
    }
  }
  return prices;
}

let ok = true;
for (const rel of pages) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  const offers = extractOfferPrices(html);
  const cards = extractVisibleCardTotals(html);
  const pkgId = (html.match(/id="wm-standard-packages"[^>]*data-product-id="([^"]+)"/) || [])[1];
  const product = (html.match(/class="price-calculator-container"[^>]*data-product="([^"]+)"/) ||
    html.match(/data-product="([^"]+)"/) || [])[1];

  const cardCount = (html.match(/class="wm-std-pkg-card"/g) || []).length;
  const offerCount = offers.length;

  console.log('\n==', rel);
  console.log('product=', product, 'pkgId=', pkgId, 'cards=', cardCount, 'offers=', offerCount);

  if (!pkgId || pkgId !== product) {
    console.log('FAIL product/pkg identity mismatch');
    ok = false;
  }
  if (cardCount !== offerCount || offerCount === 0) {
    console.log('FAIL card/Offer count inequality');
    ok = false;
  }

  // Compare offer prices to unique high totals from cards section
  // Prefer matching each offer price appears in card markup
  let matched = 0;
  for (const p of offers) {
    const rounded = String(Math.round(p));
    if (html.includes(`"price":"${rounded}"`) || html.includes(`"price":"${p}"`)) {
      // already in json
    }
    const display = '₹' + Math.round(p).toLocaleString('en-IN');
    const displayPlain = '₹' + Math.round(p);
    const displayComma = '₹' + Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (
      html.includes(`data-pkg-amount="${p}"`) ||
      html.includes(`data-pkg-amount="${Math.round(p)}"`) ||
      html.includes(displayComma) ||
      html.includes(displayPlain) ||
      cards.includes(Math.round(p)) ||
      cards.includes(p)
    ) {
      matched++;
      console.log('OK Offer', p, 'found in cards/SSR');
    } else {
      console.log('FAIL Offer', p, 'not found in card markup; sample cards=', cards.slice(0, 5));
      ok = false;
    }
  }
  console.log('matched', matched, '/', offers.length);
}

if (!ok) {
  console.error('\nBATCH 1A OFFER EQUALITY: FAIL');
  process.exit(1);
}
console.log('\nBATCH 1A OFFER EQUALITY: PASS');
