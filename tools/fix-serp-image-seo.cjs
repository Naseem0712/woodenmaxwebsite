#!/usr/bin/env node
/**
 * Bulk-fix SERP image signals:
 * - Add link rel="image_src" + meta name="image" from og:image when missing
 * - Add primaryImageOfPage WebPage JSON-LD when missing
 * - Add image field to Product JSON-LD when missing
 * - Remap known broken og:image paths to existing files
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const IMAGE_FALLBACKS = {
  'images/products/aluminium-windows/top-hung-aluminium-casement-window.webp':
    'images/products/top-hung-casment-window-pic/top-hung-aluminium-casement-window-lucknow.webp',
  'images/products/aluminium-windows/3-track-aluminium-sliding-window.webp':
    'images/products/aluminium-windows/3-track-aluminium-sliding-window-with-mesh.webp',
  'images/products/shower-partitions/frameless-shower-glass-partition.webp':
    'images/products/shower-partitions/frameless-shower-glass-door-openable-sliding-india.webp',
  'images/products/Grills/window-safety-grill-design.webp':
    'images/products/Grills/aluminium-window-grill-design-modern.webp',
  'images/products/Grills/balcony-safety-grill-design.webp':
    'images/products/Grills/aluminium-child-safety-balcony-grill.webp',
  'images/products/Grills/iron-window-grill-design.webp':
    'images/products/Grills/window-grill-design.webp',
  'images/products/metal-louvers/aluminium-ceiling-louvers-pergola-backyard.webp':
    'images/products/metal-louvers/aluminium-ceiling-louver-pergola-design.webp',
  'images/products/metal-louvers/aluminium-louver-canopy-elevation-facade.webp':
    'images/products/metal-louvers/aluminium-louver-canopy-entrance-design.webp',
  'images/products/metal-louvers/wooden-finish-aluminium-louvers-elevation.webp':
    'images/products/metal-louvers/wooden-finish-aluminium-louver-building-exterior.webp',
};

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith('.html')) acc.push(p);
  }
  return acc;
}

function urlToLocal(url) {
  return decodeURIComponent(url.replace(/^https?:\/\/woodenmax\.in\//i, ''));
}

function localToUrl(local) {
  return 'https://woodenmax.in/' + local.split('/').map(encodeURIComponent).join('/').replace(/%2F/g, '/');
}

function fileExists(localPath) {
  return fs.existsSync(path.join(ROOT, localPath));
}

function resolveImageUrl(url) {
  let local = urlToLocal(url);
  if (fileExists(local)) return localToUrl(local);
  if (IMAGE_FALLBACKS[local]) {
    const fb = IMAGE_FALLBACKS[local];
    if (fileExists(fb)) return localToUrl(fb);
  }
  // Try case-insensitive folder match for Grills vs grills
  const parts = local.split('/');
  const fileName = parts.pop();
  const dir = path.join(ROOT, ...parts);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    const match = files.find((f) => f.toLowerCase() === fileName.toLowerCase());
    if (match) return localToUrl([...parts, match].join('/'));
  }
  return url;
}

function getOgImage(html) {
  const m = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  return m ? m[1] : null;
}

function replaceOgImage(html, oldUrl, newUrl) {
  if (oldUrl === newUrl) return html;
  return html
    .split(oldUrl).join(newUrl)
    .replace(/<meta\s+name="twitter:image"\s+content="[^"]*"/gi, (tag) => {
      return tag.replace(/content="[^"]*"/, `content="${newUrl}"`);
    });
}

function hasImageSrc(html) {
  return /rel=["']image_src["']/i.test(html);
}

function hasMetaImage(html) {
  return /<meta\s+name=["']image["']/i.test(html);
}

function hasPrimaryImageOfPage(html) {
  return /primaryImageOfPage/i.test(html);
}

function insertAfterCanonical(html, block) {
  const re = /(<link\s+rel="canonical"[^>]*>\s*)/i;
  if (re.test(html)) return html.replace(re, `$1${block}`);
  const re2 = /(<meta\s+name="robots"[^>]*>\s*)/i;
  if (re2.test(html)) return html.replace(re2, `$1${block}`);
  return html.replace(/(<head[^>]*>\s*)/i, `$1${block}`);
}

function addImageMeta(html, imageUrl) {
  let out = html;
  const block =
    `  <link rel="image_src" href="${imageUrl}" />\n` +
    `  <meta name="image" content="${imageUrl}" />\n`;
  if (!hasImageSrc(out) || !hasMetaImage(out)) {
    if (!hasImageSrc(out) && !hasMetaImage(out)) {
      out = insertAfterCanonical(out, block);
    } else if (!hasImageSrc(out)) {
      out = out.replace(/(<meta\s+name=["']image["'][^>]*>)/i, `  <link rel="image_src" href="${imageUrl}" />\n$1`);
    } else {
      out = out.replace(/(<link\s+rel=["']image_src["'][^>]*>)/i, `$1\n  <meta name="image" content="${imageUrl}" />`);
    }
  }
  return out;
}

function addPrimaryImageSchema(html, imageUrl, pageUrl) {
  if (hasPrimaryImageOfPage(html)) return html;
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const name = (titleMatch ? titleMatch[1] : 'WoodenMax Product Page').replace(/"/g, '\\"').slice(0, 120);
  const desc = (descMatch ? descMatch[1] : name).replace(/"/g, '\\"').slice(0, 200);
  const altMatch = html.match(/<meta\s+property="og:image:alt"\s+content="([^"]*)"/i);
  const caption = (altMatch ? altMatch[1] : name).replace(/"/g, '\\"').slice(0, 120);

  const schema = `\n  <script type="application/ld+json">\n  {\n    "@context": "https://schema.org",\n    "@type": "WebPage",\n    "url": "${pageUrl}",\n    "name": "${name}",\n    "description": "${desc}",\n    "primaryImageOfPage": {\n      "@type": "ImageObject",\n      "url": "${imageUrl}",\n      "width": 1200,\n      "height": 800,\n      "caption": "${caption}"\n    }\n  }\n  </script>`;

  const idx = html.search(/<script\s+type="application\/ld\+json">/i);
  if (idx !== -1) return html.slice(0, idx) + schema + html.slice(idx);
  return html.replace(/<\/head>/i, schema + '\n</head>');
}

function addProductImage(html, imageUrl) {
  return html.replace(
    /(<script\s+type="application\/ld\+json">\s*\{[\s\S]*?"@type"\s*:\s*"Product"[\s\S]*?)(,\s*"offers"|,\s*"manufacturer"|,\s*"category"|,\s*"brand")/,
    (full, head, tail) => {
      if (/"image"\s*:/.test(head)) return full;
      return `${head},\n    "image": "${imageUrl}"${tail}`;
    }
  );
}

function getCanonical(html) {
  const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  return m ? m[1] : null;
}

const htmlFiles = walk(ROOT).filter((f) => {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  return rel.startsWith('products/') || rel === 'index.html' || rel.startsWith('catalog');
});

const report = { fixed: [], broken: [], skipped: [] };

for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let html = fs.readFileSync(file, 'utf8');
  const og = getOgImage(html);
  if (!og) {
    report.skipped.push(rel);
    continue;
  }

  const resolved = resolveImageUrl(og);
  const localResolved = urlToLocal(resolved);
  if (!fileExists(localResolved)) {
    report.broken.push({ rel, og, resolved: localResolved });
    continue;
  }

  let changed = false;
  if (resolved !== og) {
    html = replaceOgImage(html, og, resolved);
    changed = true;
  }

  const before = html;
  html = addImageMeta(html, resolved);
  if (html !== before) changed = true;

  const canonical = getCanonical(html) || `https://woodenmax.in/${rel.replace(/index\.html$/, '').replace(/\.html$/, '')}`;
  const beforeSchema = html;
  html = addPrimaryImageSchema(html, resolved, canonical);
  if (html !== beforeSchema) changed = true;

  const beforeProduct = html;
  html = addProductImage(html, resolved);
  if (html !== beforeProduct) changed = true;

  if (changed) {
    fs.writeFileSync(file, html, 'utf8');
    report.fixed.push(rel);
  }
}

console.log('Fixed files:', report.fixed.length);
report.fixed.forEach((f) => console.log('  +', f));
console.log('\nStill broken og:image:', report.broken.length);
report.broken.forEach(({ rel, og, resolved }) => console.log('  !', rel, '\n     og:', og, '\n     tried:', resolved));
console.log('\nNo og:image (skipped):', report.skipped.length);
