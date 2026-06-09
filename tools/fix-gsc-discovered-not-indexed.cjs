#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 1) quality-control -> quality-testing-process (broken EEAT links)
function fixQualityControlLinks() {
  const re = /about\/quality-control/g;
  let n = 0;
  function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(html|js|cjs)$/.test(e.name)) {
        const t = fs.readFileSync(p, 'utf8');
        if (!re.test(t)) continue;
        fs.writeFileSync(p, t.replace(/about\/quality-control/g, 'about/quality-testing-process'));
        console.log('quality link:', path.relative(ROOT, p));
        n++;
      }
    }
  }
  walk(ROOT);
  return n;
}

// 2) case-studies breadcrumb -> about hub
function fixCaseStudyBreadcrumbs() {
  const dir = path.join(ROOT, 'about');
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.startsWith('case-study') || !f.endsWith('.html')) continue;
    const p = path.join(dir, f);
    let t = fs.readFileSync(p, 'utf8');
    const o = t;
    t = t.replace(/https:\/\/woodenmax\.in\/about\/case-studies/g, 'https://woodenmax.in/about');
    t = t.replace(/href="\.\.\/about\/case-studies"/g, 'href="../about"');
    if (t !== o) {
      fs.writeFileSync(p, t);
      console.log('case breadcrumb:', f);
      n++;
    }
  }
  return n;
}

// 3) City product pages — cross-link to /city/* hub (reduces duplicate signal)
const CITY_HUB = {
  bangalore: { label: 'Bengaluru', hub: 'bangalore' },
  chandigarh: { label: 'Chandigarh', hub: 'delhi' },
  delhi: { label: 'Delhi NCR', hub: 'delhi' },
  hyderabad: { label: 'Hyderabad', hub: 'hyderabad' },
  mumbai: { label: 'Mumbai', hub: 'mumbai' },
  pune: { label: 'Pune', hub: 'pune' },
  vijayawada: { label: 'Vijayawada', hub: 'hyderabad' },
  visakhapatnam: { label: 'Visakhapatnam', hub: 'hyderabad' },
  warangal: { label: 'Warangal', hub: 'hyderabad' },
};

function cityBanner(citySlug, depth) {
  const meta = CITY_HUB[citySlug];
  if (!meta) return '';
  const prefix = '../'.repeat(depth);
  return `\n<div class="container" style="padding:0.75rem 1rem 0;">\n  <p class="cluster-prose" style="margin:0;padding:0.65rem 1rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:0.5rem;font-size:0.875rem;">\n    <strong>City hub:</strong> <a href="${prefix}city/${meta.hub}">WoodenMax ${meta.label}</a> — all products, install teams &amp; transport policy for your city.\n  </p>\n</div>\n`;
}

function fixCityProductCrosslinks() {
  const dirs = [
    path.join(ROOT, 'products', 'aluminium-windows'),
    path.join(ROOT, 'products', 'glass-elevation'),
  ];
  let n = 0;
  for (const dir of dirs) {
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/-(bangalore|chandigarh|delhi|hyderabad|mumbai|pune|vijayawada|visakhapatnam|warangal)\.html$/);
      if (!m) continue;
      const city = m[1];
      const p = path.join(dir, f);
      let t = fs.readFileSync(p, 'utf8');
      if (t.includes('City hub:')) continue;
      const re = /<\/nav>\r?\n<header class="cluster-hero">/;
      if (!re.test(t)) continue;
      const banner = cityBanner(city, 2);
      if (!banner) continue;
      t = t.replace(re, `</nav>${banner}<header class="cluster-hero">`);
      fs.writeFileSync(p, t);
      console.log('city banner:', f);
      n++;
    }
  }
  return n;
}

// 4) Lower sitemap priority for city product URLs (crawl budget)
function lowerCitySitemapPriority() {
  const sm = path.join(ROOT, 'sitemap.xml');
  let t = fs.readFileSync(sm, 'utf8');
  const o = t;
  const patterns = [
    /aluminium-window-price-(bangalore|chandigarh|delhi|hyderabad|mumbai|pune|vijayawada|visakhapatnam|warangal)/g,
    /glass-elevation-price-(bangalore|chandigarh|delhi|mumbai|pune|vijayawada|visakhapatnam|warangal)/g,
  ];
  for (const re of patterns) {
    t = t.replace(
      new RegExp(`(<loc>https://woodenmax\\.in/products/[^<]*${re.source}[^<]*</loc>\\s*<lastmod>[^<]*</lastmod>\\s*<changefreq>[^<]*</changefreq>\\s*)<priority>0\\.8</priority>`, 'g'),
      '$1<priority>0.55</priority>'
    );
  }
  // simpler block replace for city URLs
  t = t.replace(
    /(<loc>https:\/\/woodenmax\.in\/products\/(?:aluminium-windows|glass-elevation)\/(?:aluminium-window|glass-elevation)-price-(?:bangalore|chandigarh|delhi|hyderabad|mumbai|pune|vijayawada|visakhapatnam|warangal)<\/loc>\s*<lastmod>[^<]*<\/lastmod>\s*<changefreq>[^<]*<\/changefreq>\s*)<priority>[\d.]+<\/priority>/g,
    '$1<priority>0.55</priority>'
  );
  if (t !== o) {
    fs.writeFileSync(sm, t);
    console.log('sitemap: lowered city product priority');
    return 1;
  }
  return 0;
}

console.log('quality links:', fixQualityControlLinks());
console.log('case breadcrumbs:', fixCaseStudyBreadcrumbs());
console.log('city banners:', fixCityProductCrosslinks());
console.log('sitemap:', lowerCitySitemapPriority());
console.log('done');
