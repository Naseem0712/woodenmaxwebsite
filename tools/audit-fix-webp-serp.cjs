#!/usr/bin/env node
/**
 * Audit all .webp images and fix SERP image signals on every HTML page.
 * - Report dimensions + >=1200px eligibility
 * - Create *-1200.webp for images narrower than 1200px
 * - Upsert head meta + WebPage primaryImageOfPage + standalone ImageObject JSON-LD
 *
 * Run: node tools/audit-fix-webp-serp.cjs
 *      node tools/audit-fix-webp-serp.cjs --audit-only
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://woodenmax.in';
const MIN_WIDTH = 1200;
const AUDIT_ONLY = process.argv.includes('--audit-only');
const MARKER = 'wm-serp-image-object';

/** Broken og:image paths → existing on-disk hero files */
const IMAGE_FALLBACKS = {
  'images/eeat/case-tower-mum-hero.webp':
    'images/products/metal-louvers/commercial-building-aluminium-louver-installation.webp',
  'images/eeat/case-delhi-bungalow-hero.webp':
    'images/hero/villa-front-elevation-louvers-slim-profile-glazing-hpl-premium-design.webp',
  'images/eeat/case-makobrew-hero.webp':
    'images/products/aluminium-windows/luxury-aluminium-elevation-windows-doors-villa.webp',
  'images/eeat/case-villa-hyd-hero.webp':
    'images/hero/premium-front-elevation-louvers-slim-glass-windows-hpl-facade-india.webp',
  'images/eeat/certifications-hero.webp':
    'images/Founder-Naseem.webp',
  'images/eeat/factory-hero.webp':
    'images/products/Installation Process/window-installation-frame-fixing.webp',
  'images/eeat/manufacturing-hero.webp':
    'images/products/Installation Process/window-installation-frame-fixing.webp',
  'images/eeat/sourcing-hero.webp':
    'images/products/What is System Window/system-window-components-breakdown.webp',
  'images/eeat/qc-hero.webp':
    'images/products/Glass Thickness/glass-thickness-section-view.webp',
};

const SKIP_HTML = new Set([
  'calculator-design-preview.html',
  '404.html',
  'api/calculate/index.html',
]);

const SKIP_DIRS = new Set(['node_modules', '.git', 'tools', 'GSC', 'SGC ISSUE', '_grills-source']);

function walk(dir, ext, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(p, ext, acc);
    } else if (!ext || ent.name.endsWith(ext)) acc.push(p);
  }
  return acc;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function toUrl(localRel) {
  return BASE + '/' + localRel.split('/').map((s) => encodeURIComponent(s)).join('/').replace(/%2F/g, '/');
}

function urlToLocal(url) {
  return decodeURIComponent(url.replace(/^https?:\/\/woodenmax\.in\//i, '').split('?')[0]);
}

function fileExists(localRel) {
  return fs.existsSync(path.join(ROOT, localRel));
}

async function getMeta(abs) {
  const m = await sharp(abs).metadata();
  return { width: m.width || 0, height: m.height || 0 };
}

function serpLocalPath(localRel) {
  return localRel.replace(/\.webp$/i, '-1200.webp');
}

async function ensureSerpImage(localRel, audit) {
  const abs = path.join(ROOT, localRel);
  if (!fileExists(localRel)) return null;

  let meta;
  try {
    meta = await getMeta(abs);
  } catch (e) {
    audit.errors.push({ file: localRel, error: e.message });
    return null;
  }

  const entry = {
    file: localRel,
    width: meta.width,
    height: meta.height,
    meets1200: meta.width >= MIN_WIDTH,
  };
  audit.images.push(entry);

  if (meta.width >= MIN_WIDTH) {
    return { localRel, width: meta.width, height: meta.height, resized: false };
  }

  const outRel = serpLocalPath(localRel);
  const outAbs = path.join(ROOT, outRel);

  if (!AUDIT_ONLY) {
    if (!fs.existsSync(outAbs)) {
      await sharp(abs)
        .resize(MIN_WIDTH, null, { withoutEnlargement: false, fit: 'inside' })
        .webp({ quality: 82 })
        .toFile(outAbs);
      audit.created.push(outRel);
    }
  }

  let outMeta = meta;
  if (fs.existsSync(outAbs)) {
    outMeta = await getMeta(outAbs);
  } else if (!AUDIT_ONLY) {
    outMeta = { width: MIN_WIDTH, height: Math.round((meta.height / meta.width) * MIN_WIDTH) };
  }

  audit.small.push({ original: localRel, serp: outRel, originalW: meta.width, serpW: outMeta.width });
  return { localRel: outRel, width: outMeta.width, height: outMeta.height, resized: true };
}

function getPrimaryImageUrl(html) {
  const og = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
    || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
  if (og) return og[1].trim();
  const imgSrc = html.match(/<link\s+[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i);
  if (imgSrc) return imgSrc[1].trim();
  const metaImg = html.match(/<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i);
  if (metaImg) return metaImg[1].trim();
  return null;
}

function getCanonical(html, fileRel) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (m) return m[1].trim();
  const slug = fileRel.replace(/index\.html$/, '').replace(/\.html$/, '');
  return slug ? `${BASE}/${slug}` : `${BASE}/`;
}

function upsertTag(html, pattern, replacement, insertAfter) {
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace(insertAfter, `$1${replacement}`);
}

function upsertImageHead(html, imageUrl, w, h) {
  let out = html;

  const linkRe = /<link\s+[^>]*rel=["']image_src["'][^>]*>/i;
  const linkTag = `  <link rel="image_src" href="${imageUrl}" />`;
  out = linkRe.test(out)
    ? out.replace(linkRe, linkTag)
    : out.replace(/(<link\s+rel=["']canonical["'][^>]*>\s*)/i, `$1${linkTag}\n`);

  const metaImageRe = /<meta\s+name=["']image["'][^>]*>/i;
  const metaImageTag = `  <meta name="image" content="${imageUrl}" />`;
  out = metaImageRe.test(out)
    ? out.replace(metaImageRe, metaImageTag)
    : out.replace(/(<link\s+rel=["']image_src["'][^>]*>\s*)/i, `$1${metaImageTag}\n`);

  const itempropRe = /<meta\s+itemprop=["']image["'][^>]*>/i;
  const itempropTag = `  <meta itemprop="image" content="${imageUrl}" />`;
  out = itempropRe.test(out)
    ? out.replace(itempropRe, itempropTag)
    : out.replace(/(<meta\s+name=["']image["'][^>]*>\s*)/i, `$1${itempropTag}\n`);

  const ogRe = /<meta\s+property=["']og:image["']\s+content=["'][^"']*["'][^>]*>/i;
  const ogTag = `  <meta property="og:image" content="${imageUrl}" />`;
  out = ogRe.test(out) ? out.replace(ogRe, ogTag) : out.replace(/(<meta\s+itemprop=["']image["'][^>]*>\s*)/i, `$1${ogTag}\n`);

  const ogWRe = /<meta\s+property=["']og:image:width["'][^>]*>/i;
  const ogWTag = `  <meta property="og:image:width" content="${w}" />`;
  out = ogWRe.test(out) ? out.replace(ogWRe, ogWTag) : out.replace(/(<meta\s+property=["']og:image["'][^>]*>\s*)/i, `$1${ogWTag}\n`);

  const ogHRe = /<meta\s+property=["']og:image:height["'][^>]*>/i;
  const ogHTag = `  <meta property="og:image:height" content="${h}" />`;
  out = ogHRe.test(out) ? out.replace(ogHRe, ogHTag) : out.replace(/(<meta\s+property=["']og:image:width["'][^>]*>\s*)/i, `$1${ogHTag}\n`);

  // Keep twitter:image aligned
  out = out.replace(/<meta\s+name=["']twitter:image["']\s+content=["'][^"']*["']/i, `<meta name="twitter:image" content="${imageUrl}"`);

  return out;
}

function parseJsonLdScripts(html) {
  const re = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    blocks.push({ full: m[0], json: m[1], index: m.index });
  }
  return blocks;
}

function updateJsonLd(html, pageUrl, imageUrl, w, h) {
  let out = html;
  const blocks = parseJsonLdScripts(html);
  let primaryDone = false;
  let standaloneDone = false;

  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block.json.trim());
    } catch (e) {
      continue;
    }

    const items = Array.isArray(data) ? data : [data];
    let changed = false;

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      if (item['@type'] === 'WebPage' || (Array.isArray(item['@type']) && item['@type'].includes('WebPage'))) {
        item.primaryImageOfPage = {
          '@type': 'ImageObject',
          url: imageUrl,
          width: w,
          height: h,
        };
        primaryDone = true;
        changed = true;
      }

      if (item['@id'] === MARKER || (item['@type'] === 'ImageObject' && item.representativeOfPage === true)) {
        item['@context'] = 'https://schema.org';
        item['@type'] = 'ImageObject';
        item['@id'] = MARKER;
        item.contentUrl = imageUrl;
        item.url = imageUrl;
        item.width = w;
        item.height = h;
        item.representativeOfPage = true;
        item.isPartOf = { '@type': 'WebPage', url: pageUrl };
        standaloneDone = true;
        changed = true;
      }
    }

    if (changed) {
      const nextJson = JSON.stringify(Array.isArray(data) ? items : items[0], null, 2)
        .split('\n').map((line) => '  ' + line).join('\n');
      const nextBlock = `<script type="application/ld+json">\n${nextJson}\n  </script>`;
      out = out.replace(block.full, nextBlock);
    }
  }

  const standaloneSchema = `\n  <script type="application/ld+json">\n  {\n    "@context": "https://schema.org",\n    "@type": "ImageObject",\n    "@id": "${MARKER}",\n    "contentUrl": "${imageUrl}",\n    "url": "${imageUrl}",\n    "width": ${w},\n    "height": ${h},\n    "representativeOfPage": true,\n    "isPartOf": {\n      "@type": "WebPage",\n      "url": "${pageUrl}"\n    }\n  }\n  </script>`;

  if (!standaloneDone) {
    const headClose = out.search(/<\/head>/i);
    if (headClose !== -1) out = out.slice(0, headClose) + standaloneSchema + '\n' + out.slice(headClose);
  }

  if (!primaryDone) {
    const titleMatch = out.match(/<title>([^<]+)<\/title>/i);
    const descMatch = out.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)"/i);
    const name = (titleMatch ? titleMatch[1] : 'WoodenMax').replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 140);
    const desc = (descMatch ? descMatch[1] : name).replace(/\\/g, '\\\\').replace(/"/g, '\\"').slice(0, 220);
    const webPageSchema = `\n  <script type="application/ld+json">\n  {\n    "@context": "https://schema.org",\n    "@type": "WebPage",\n    "url": "${pageUrl}",\n    "name": "${name}",\n    "description": "${desc}",\n    "primaryImageOfPage": {\n      "@type": "ImageObject",\n      "url": "${imageUrl}",\n      "width": ${w},\n      "height": ${h}\n    }\n  }\n  </script>`;
    const firstLd = out.search(/<script\s+type=["']application\/ld\+json"/i);
    if (firstLd !== -1) out = out.slice(0, firstLd) + webPageSchema + out.slice(firstLd);
    else out = out.replace(/<\/head>/i, webPageSchema + '\n</head>');
  }

  return out;
}

async function main() {
  const audit = {
    images: [],
    small: [],
    created: [],
    errors: [],
    pagesFixed: [],
    pagesSkipped: [],
    pagesNoImage: [],
  };

  const webps = walk(path.join(ROOT, 'images'), '.webp');
  for (const abs of webps) {
    const localRel = rel(abs);
    if (/-1200\.webp$/i.test(localRel)) continue;
    try {
      const meta = await getMeta(abs);
      audit.images.push({
        file: localRel,
        width: meta.width,
        height: meta.height,
        meets1200: meta.width >= MIN_WIDTH,
      });
    } catch (e) {
      audit.errors.push({ file: localRel, error: e.message });
    }
  }

  audit.images.sort((a, b) => a.file.localeCompare(b.file));

  const reportPath = path.join(ROOT, 'tools/webp-serp-audit-report.txt');
  const lines = [
    '# WebP SERP Image Audit',
    `# Generated: ${new Date().toISOString()}`,
    `# Total images: ${audit.images.length}`,
    `# >=1200px: ${audit.images.filter((i) => i.meets1200).length}`,
    `# <1200px: ${audit.images.filter((i) => !i.meets1200).length}`,
    '',
    'file\twidth\theight\t>=1200',
  ];
  for (const i of audit.images) {
    lines.push(`${i.file}\t${i.width}\t${i.height}\t${i.meets1200 ? 'YES' : 'NO'}`);
  }
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

  if (AUDIT_ONLY) {
    console.log('Audit written to', reportPath);
    console.log('>=1200:', audit.images.filter((i) => i.meets1200).length);
    console.log('<1200:', audit.images.filter((i) => !i.meets1200).length);
    return;
  }

  const htmlFiles = walk(ROOT, '.html').filter((f) => {
    const r = rel(f);
    return !SKIP_HTML.has(r) && !r.startsWith('tools/');
  });

  for (const abs of htmlFiles) {
    const fileRel = rel(abs);
    let html = fs.readFileSync(abs, 'utf8');
    let imageUrlRaw = getPrimaryImageUrl(html);
    if (!imageUrlRaw) {
      audit.pagesNoImage.push(fileRel);
      continue;
    }

    let localRel = urlToLocal(imageUrlRaw);
    if (!fileExists(localRel) && IMAGE_FALLBACKS[localRel]) {
      localRel = IMAGE_FALLBACKS[localRel];
      imageUrlRaw = toUrl(localRel);
    }
    if (!fileExists(localRel)) {
      audit.pagesSkipped.push({ file: fileRel, reason: 'missing image file', image: localRel });
      continue;
    }

    const serp = await ensureSerpImage(localRel, audit);
    if (!serp) {
      audit.pagesSkipped.push({ file: fileRel, reason: 'could not resolve serp image', image: localRel });
      continue;
    }

    const pageUrl = getCanonical(html, fileRel);
    const imageUrl = toUrl(serp.localRel);
    const before = html;
    html = upsertImageHead(html, imageUrl, serp.width, serp.height);
    html = updateJsonLd(html, pageUrl, imageUrl, serp.width, serp.height);

    if (html !== before) {
      fs.writeFileSync(abs, html, 'utf8');
      audit.pagesFixed.push({
        file: fileRel,
        image: serp.localRel,
        width: serp.width,
        height: serp.height,
        resized: serp.resized,
      });
    }
  }

  const summaryPath = path.join(ROOT, 'tools/webp-serp-fix-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(audit, null, 2), 'utf8');

  console.log('Audit report:', reportPath);
  console.log('Fix summary:', summaryPath);
  console.log('Images scanned:', audit.images.length);
  console.log('>=1200px:', audit.images.filter((i) => i.meets1200).length);
  console.log('<1200px (need/use -1200):', audit.images.filter((i) => !i.meets1200).length);
  console.log('New -1200.webp created:', audit.created.length);
  console.log('HTML pages fixed:', audit.pagesFixed.length);
  console.log('Pages without og:image:', audit.pagesNoImage.length);
  console.log('Pages skipped:', audit.pagesSkipped.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
