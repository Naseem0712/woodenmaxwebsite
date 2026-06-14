#!/usr/bin/env node
/**
 * Point internal links at short canonical shower SEO URLs (avoid 301 chains in GSC).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SHORT_SLUGS = [
  'glass-shower-partition-price',
  'sliding-shower-door-price',
  'fixed-glass-shower-panel-price',
  'shower-enclosure-price',
  'frameless-glass-shower-price',
  'bathroom-shower-design-price',
  'small-bathroom-shower-design',
  'corner-shower-partition-price',
  'walk-in-shower-glass-price',
  'shower-curtain-vs-glass-partition',
  'framed-vs-frameless-shower',
  'shower-glass-thickness',
  'shower-glass-types',
  'shower-installation-cost',
  'shower-glass-maintenance',
];

function fixHubHtml() {
  const file = path.join(ROOT, 'products', 'shower-partitions.html');
  let html = fs.readFileSync(file, 'utf8');
  let n = 0;
  SHORT_SLUGS.forEach((slug) => {
    const from = `./shower-partitions/${slug}`;
    const to = `../../${slug}`;
    const count = html.split(from).length - 1;
    if (count) {
      html = html.split(from).join(to);
      n += count;
    }
  });
  fs.writeFileSync(file, html, 'utf8');
  console.log('shower-partitions.html:', n, 'href updates');
}

function fixNavTree() {
  const file = path.join(ROOT, 'js', 'nav-tree.js');
  let js = fs.readFileSync(file, 'utf8');
  let n = 0;
  SHORT_SLUGS.forEach((slug) => {
    const from = `products/shower-partitions/${slug}`;
    const to = slug;
    const count = js.split(from).length - 1;
    if (count) {
      js = js.split(from).join(to);
      n += count;
    }
  });
  fs.writeFileSync(file, js, 'utf8');
  console.log('nav-tree.js:', n, 'href updates');
}

fixHubHtml();
fixNavTree();
