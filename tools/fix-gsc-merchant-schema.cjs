#!/usr/bin/env node
/**
 * Fix GSC Merchant Listings errors on category hub pages:
 * - Remove Product JSON-LD (hubs are CollectionPages, not single products)
 * - Fix ListItem: use "item" instead of non-standard "url"
 * - Remove duplicate WebPage blocks on pergola hub
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const HUB_FILES = [
  'products/telescope-windows.html',
  'products/glass-railing.html',
  'products/shower-partitions.html',
  'products/elevation-cladding.html',
  'products/glass-elevation.html',
  'products/aluminium-windows.html',
  'products/folding-systems.html',
  'products/grills.html',
  'products/mirror-profiles/index.html',
  'products/metal-louvers/index.html',
  'products/pergola.html',
];

function fixListItem(el) {
  if (!el || el['@type'] !== 'ListItem') return;
  if (el.url && !el.item) {
    el.item = {
      '@type': 'WebPage',
      name: el.name,
      url: el.url,
    };
    delete el.url;
  }
}

function walkFixListItems(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach(walkFixListItems);
    return;
  }
  if (obj['@type'] === 'ListItem') fixListItem(obj);
  if (Array.isArray(obj.itemListElement)) {
    obj.itemListElement.forEach(fixListItem);
  }
  if (obj.mainEntity && typeof obj.mainEntity === 'object') {
    walkFixListItems(obj.mainEntity);
  }
  Object.keys(obj).forEach(function (k) {
    if (k === 'itemListElement' || k === 'mainEntity') return;
    walkFixListItems(obj[k]);
  });
}

function parseJsonLdBlocks(html) {
  const re = /<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push({
      full: m[0],
      inner: m[1],
      index: m.index,
    });
  }
  return blocks;
}

function topType(data) {
  if (!data || typeof data !== 'object') return null;
  return data['@type'] || null;
}

function processFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn('SKIP (missing):', relPath);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const blocks = parseJsonLdBlocks(html);
  let removedProducts = 0;
  let fixedListItems = 0;
  const kept = [];
  const webpageUrls = [];

  blocks.forEach(function (block) {
    let data;
    try {
      data = JSON.parse(block.inner.trim());
    } catch (e) {
      kept.push(block.full);
      return;
    }

    const type = topType(data);
    if (type === 'Product') {
      removedProducts++;
      return;
    }

    if (type === 'WebPage' && data.url) {
      webpageUrls.push(data.url);
    }

    const before = JSON.stringify(data);
    walkFixListItems(data);
    const after = JSON.stringify(data);
    if (before !== after) fixedListItems++;

    kept.push(
      '<script type="application/ld+json">\n' +
        JSON.stringify(data, null, 2) +
        '\n</script>'
    );
  });

  // Remove duplicate WebPage with same url (keep first occurrence only)
  if (relPath === 'products/pergola.html') {
    const seenWebPages = new Set();
    const deduped = [];
    kept.forEach(function (script) {
      try {
        const inner = script.match(/<script[^>]*>([\s\S]*?)<\/script>/i)[1];
        const data = JSON.parse(inner.trim());
        if (data['@type'] === 'WebPage' && data.url) {
          if (seenWebPages.has(data.url)) return;
          seenWebPages.add(data.url);
        }
      } catch (e) { /* keep */ }
      deduped.push(script);
    });
    kept.length = 0;
    kept.push.apply(kept, deduped);
  }

  // Rebuild HTML: replace all ld+json blocks sequentially
  let rebuilt = html.replace(
    /<script\s+type="application\/ld\+json"\s*>[\s\S]*?<\/script>/gi,
    function () {
      return kept.shift() || '';
    }
  );

  // Clean orphaned Product Schema comments
  rebuilt = rebuilt.replace(
    /\n\s*<!--\s*Product Schema[^>]*-->\s*\n/gi,
    '\n'
  );

  if (relPath === 'products/mirror-profiles/index.html') {
    rebuilt = rebuilt.replace(
      /<meta property="og:type" content="product"\s*\/?>/i,
      '<meta property="og:type" content="website" />'
    );
  }

  fs.writeFileSync(filePath, rebuilt, 'utf8');
  console.log(
    relPath +
      ': removed ' +
      removedProducts +
      ' Product block(s), fixed ListItem trees: ' +
      fixedListItems
  );
}

HUB_FILES.forEach(processFile);
console.log('Done.');
