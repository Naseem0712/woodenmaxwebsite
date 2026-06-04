#!/usr/bin/env node
/**
 * tools/optimize-speed.cjs
 *
 * Site-wide performance pass for woodenmax.in:
 *  1. Convert PNG/JPEG/GIF → WebP (images/ only; keeps favicon.ico)
 *  2. Rewrite image refs in HTML/CSS/JS/JSON/XML
 *  3. Hero/above-fold: loading="eager" + fetchpriority="high"
 *  4. Below-fold: loading="lazy" + decoding="async"
 *  5. Inline critical CSS in <head>
 *  6. Non-blocking external stylesheets (preload + onload)
 *  7. Non-blocking Google Fonts
 *  8. defer on all local <script src> (except async/gtag)
 *
 * Usage:
 *   node tools/optimize-speed.cjs           # apply
 *   node tools/optimize-speed.cjs --dry     # preview
 *   node tools/optimize-speed.cjs --skip-images  # HTML/CSS/JS only
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const SKIP_IMAGES = process.argv.includes('--skip-images');

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'mcps', 'agent-transcripts', 'terminals', '.snapshots',
]);

const TEXT_EXT = new Set([
  '.html', '.htm', '.css', '.js', '.cjs', '.mjs', '.json', '.xml', '.md',
]);

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif']);

/** Paths that must stay raster (favicon pipeline). */
const KEEP_RASTER = new Set([
  'favicon.ico',
  'favicon.png',
  'images/favicon.png',
  'images/favicon-192.png',
]);

const CRITICAL_CSS = fs.readFileSync(
  path.join(ROOT, 'css/critical-above-fold.css'),
  'utf8'
).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();

const CRITICAL_MARKER = 'id="wm-critical-css"';

/** Never async-load these — prevents FOUC on nav/layout (see tools/fix-css-loading.cjs). */
const BLOCKING_CSS = new Set([
  'styles.css',
  'site-nav.css',
  'site-footer.css',
  'product-pages-global.css',
]);

const stats = {
  imagesConverted: 0,
  htmlFiles: 0,
  htmlChanged: 0,
  textRefsUpdated: 0,
  scriptsDeferred: 0,
  stylesAsync: 0,
  criticalInjected: 0,
  imgsHero: 0,
  imgsLazy: 0,
};

let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

function walk(dir, out, filter) {
  out = out || [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(name.name)) continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, out, filter);
    else if (!filter || filter(full)) out.push(full);
  }
  return out;
}

function relPosix(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function shouldKeepRaster(rel) {
  const n = relPosix(rel).replace(/^\.\//, '');
  if (KEEP_RASTER.has(n)) return true;
  if (n.endsWith('favicon.ico') || n.endsWith('favicon.png')) return true;
  return false;
}

/* ---------- 1. Image conversion ---------- */

async function convertImages() {
  if (SKIP_IMAGES) {
    console.log('Skipping image conversion (--skip-images)\n');
    return;
  }
  if (!sharp) {
    console.warn('⚠ sharp not installed — run: npm install\n   Skipping image conversion.\n');
    return;
  }

  const files = walk(path.join(ROOT, 'images'), [], (f) =>
    IMAGE_EXT.has(path.extname(f).toLowerCase())
  );

  for (const file of files) {
    const rel = relPosix(file);
    if (shouldKeepRaster(rel)) continue;

    const webpPath = file.replace(/\.(png|jpe?g|gif)$/i, '.webp');
    if (fs.existsSync(webpPath)) {
      console.log(`  skip (webp exists): ${rel}`);
      continue;
    }

    console.log(`  convert: ${rel} → ${path.basename(webpPath)}`);
    if (!DRY) {
      await sharp(file)
        .webp({ quality: 82, effort: 4 })
        .toFile(webpPath);
      stats.imagesConverted++;
    }
  }
  console.log('');
}

/* ---------- 2. Text reference rewrites ---------- */

function rewriteImageRefs(text) {
  let n = 0;
  const next = text
    .replace(/((?:\.\.\/)*images\/[^"'()\s]+)\.(png|jpe?g|gif)\b/gi, (m, prefix) => {
      if (prefix.toLowerCase().includes('favicon')) return m;
      n++;
      return prefix + '.webp';
    })
    .replace(/woodenmax-logo\.png/gi, (m) => m);
  stats.textRefsUpdated += n;
  return next;
}

/* ---------- 3. Script defer ---------- */

function deferScripts(html) {
  return html.replace(
    /<script(\s+)src=(["'])([^"']+)\2([^>]*)><\/script>/gi,
    (full, sp, q, src, rest) => {
      if (/\b(defer|async)\b/i.test(rest)) return full;
      if (/googletagmanager|gtag/i.test(src)) return full;
      stats.scriptsDeferred++;
      return `<script defer src=${q}${src}${q}${rest}></script>`;
    }
  );
}

/* ---------- 4. Non-blocking CSS ---------- */

function asyncStylesheets(html) {
  return html.replace(
    /<link(\s+)rel=(["'])stylesheet\2(\s+)href=(["'])([^"']+\.css)\4([^>]*)\/?>/gi,
    (full, sp1, q1, sp2, q2, href, rest) => {
      if (/wm-critical|print|onload/i.test(full)) return full;
      if (/fonts\.googleapis\.com/i.test(href)) return full;
      const base = (href.split('/').pop() || '').split('?')[0];
      if (BLOCKING_CSS.has(base)) return full;
      if (html.includes(`href="${href}" as="style"`)) return full;
      stats.stylesAsync++;
      const preload = `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">`;
      const noscript = `<noscript><link rel="stylesheet" href="${href}"></noscript>`;
      return preload + '\n  ' + noscript;
    }
  );
}

/* ---------- 5. Non-blocking Google Fonts ---------- */

function asyncGoogleFonts(html) {
  const fontRe = /<link(\s+)href=(["'])(https:\/\/fonts\.googleapis\.com\/css2[^"']+)\2(\s+)rel=(["'])stylesheet\4([^>]*)\/?>/gi;
  return html.replace(fontRe, (full, sp1, q, href) => {
    if (/media=(["'])print\1/i.test(full) && /onload/i.test(full)) return full;
    return `<link href=${q}${href}${q} rel="stylesheet" media="print" onload="this.media='all';this.onload=null;">\n  <noscript><link href=${q}${href}${q} rel="stylesheet"></noscript>`;
  });
}

/* ---------- 6. Critical CSS injection ---------- */

function injectCriticalCss(html) {
  if (html.includes(CRITICAL_MARKER)) return html;
  if (/Critical (Above-the-Fold|above-the-fold) CSS/i.test(html)) return html;
  const block = `\n  <!-- Critical above-the-fold CSS -->\n  <style ${CRITICAL_MARKER}>${CRITICAL_CSS}</style>\n`;
  const headClose = html.indexOf('</head>');
  if (headClose === -1) return html;
  stats.criticalInjected++;
  return html.slice(0, headClose) + block + html.slice(headClose);
}

/* ---------- 7. Image loading attributes ---------- */

function extractPreloadImages(html) {
  const set = new Set();
  const re = /<link[^>]+rel=(["'])preload\1[^>]+as=(["'])image\2[^>]+href=(["'])([^"']+)\3/gi;
  let m;
  while ((m = re.exec(html)) !== null) set.add(m[4].split('/').pop().toLowerCase());
  // also href before as
  const re2 = /<link[^>]+href=(["'])([^"']+\.(webp|png|jpe?g))\1[^>]+as=(["'])image\4/gi;
  while ((m = re2.exec(html)) !== null) set.add(m[2].split('/').pop().toLowerCase());
  return set;
}

function isHeroContext(before, tag) {
  if (/class=(["'][^"']*\b(?:slide-image|product-main-image|catalog-hero-product-img)\b)/i.test(tag)) return true;
  if (/id=(["'])product-main-image\1/i.test(tag)) return true;
  if (/class=(["'][^"']*\bfounder-strip-photo\b)/i.test(before + tag)) return true;
  if (/cluster-hero-media[\s\S]{0,400}$/i.test(before) && !/cluster-hero-media[\s\S]*<img/i.test(before)) return true;
  if (/hero-slider[\s\S]{0,800}$/i.test(before)) {
    const slides = (before.match(/<div class=(["'])slide\b/gi) || []).length;
    const activeNear = /slide active[\s\S]{0,200}$/i.test(before);
    if (slides <= 1 || activeNear) return true;
  }
  return false;
}

function optimizeImgTags(html) {
  const preloaded = extractPreloadImages(html);
  let heroAssigned = false;

  return html.replace(/<img\b[^>]*>/gi, (tag, offset) => {
    const before = html.slice(Math.max(0, offset - 600), offset);
    const srcM = tag.match(/\bsrc=(["'])([^"']+)\1/i);
    const srcFile = srcM ? srcM[2].split('/').pop().toLowerCase() : '';
    const isLogo = /logo|favicon/i.test(tag);
    const isHero = !isLogo && (
      isHeroContext(before, tag) ||
      (srcFile && preloaded.has(srcFile)) ||
      (!heroAssigned && /class=(["'][^"']*\bslide-image\b)/i.test(tag))
    );

    let next = tag;

    // strip existing loading/fetchpriority/decoding for clean re-apply
    next = next.replace(/\sloading=(["'])[^"']*\1/i, '');
    next = next.replace(/\sfetchpriority=(["'])[^"']*\1/i, '');
    if (!/\bdecoding=/i.test(next)) {
      next = next.replace(/<img/i, '<img decoding="async"');
    }

    if (isHero) {
      heroAssigned = true;
      stats.imgsHero++;
      next = next.replace(/<img/i, '<img loading="eager" fetchpriority="high"');
    } else if (!isLogo) {
      stats.imgsLazy++;
      next = next.replace(/<img/i, '<img loading="lazy"');
    } else {
      next = next.replace(/<img/i, '<img loading="eager"');
    }

    return next;
  });
}

/* ---------- 8. Preload hero image with fetchpriority ---------- */

function optimizePreloadLinks(html) {
  return html.replace(
    /<link[^>]*\brel=(["'])preload\1[^>]*\bas=\1image\1[^>]*>/gi,
    (full) => {
      if (/fetchpriority/i.test(full)) return full;
      return full.replace(/<link/i, '<link fetchpriority="high"');
    }
  );
}

/* ---------- Process HTML file ---------- */

function processHtml(file) {
  stats.htmlFiles++;
  let html = fs.readFileSync(file, 'utf8');
  const orig = html;

  html = rewriteImageRefs(html);
  html = injectCriticalCss(html);
  html = asyncGoogleFonts(html);
  html = asyncStylesheets(html);
  html = optimizePreloadLinks(html);
  html = optimizeImgTags(html);
  html = deferScripts(html);

  if (html !== orig) {
    stats.htmlChanged++;
    const rel = relPosix(file);
    if (DRY) console.log(`  would update: ${rel}`);
    else fs.writeFileSync(file, html, 'utf8');
  }
}

function processTextFile(file) {
  if (file.endsWith('optimize-speed.cjs')) return;
  const ext = path.extname(file).toLowerCase();
  if (!TEXT_EXT.has(ext)) return;
  if (ext === '.html' || ext === '.htm') return; // handled separately

  let text = fs.readFileSync(file, 'utf8');
  const next = rewriteImageRefs(text);
  if (next !== text) {
    if (DRY) console.log(`  refs: ${relPosix(file)}`);
    else fs.writeFileSync(file, next, 'utf8');
  }
}

function updateHeaders() {
  const headersPath = path.join(ROOT, '_headers');
  let content = fs.existsSync(headersPath)
    ? fs.readFileSync(headersPath, 'utf8')
    : '';

  const block = `
# Static assets — long cache + WebP
/images/*
  Cache-Control: public, max-age=31536000, immutable

/css/*
  Cache-Control: public, max-age=604800

/js/*
  Cache-Control: public, max-age=604800
`;

  if (!content.includes('/images/*')) {
    content += block;
    if (!DRY) {
      fs.writeFileSync(headersPath, content, 'utf8');
      console.log('Updated _headers with cache rules');
    } else {
      console.log('Would update _headers with cache rules');
    }
  }
}

async function main() {
  console.log(`\noptimize-speed  ${DRY ? '(DRY RUN)' : '(APPLY)'}\n${'='.repeat(50)}\n`);

  await convertImages();

  const htmlFiles = walk(ROOT, [], (f) => /\.html?$/i.test(f));
  console.log(`Processing ${htmlFiles.length} HTML files...\n`);
  for (const f of htmlFiles) processHtml(f);

  const textFiles = walk(ROOT, [], (f) => {
    const ext = path.extname(f).toLowerCase();
    return TEXT_EXT.has(ext) && !/\.html?$/i.test(f);
  });
  console.log(`\nUpdating refs in ${textFiles.length} text files...\n`);
  for (const f of textFiles) processTextFile(f);

  updateHeaders();

  console.log(`\n${'='.repeat(50)}`);
  console.log('Summary:');
  console.log(`  Images converted to WebP : ${stats.imagesConverted}`);
  console.log(`  HTML files scanned       : ${stats.htmlFiles}`);
  console.log(`  HTML files updated       : ${stats.htmlChanged}`);
  console.log(`  Image refs rewritten     : ${stats.textRefsUpdated}`);
  console.log(`  Scripts deferred         : ${stats.scriptsDeferred}`);
  console.log(`  Stylesheets async-loaded : ${stats.stylesAsync}`);
  console.log(`  Critical CSS injected    : ${stats.criticalInjected}`);
  console.log(`  Hero images (eager/high) : ${stats.imgsHero}`);
  console.log(`  Lazy images              : ${stats.imgsLazy}`);
  console.log(DRY ? '\n(no files modified)\n' : '\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
