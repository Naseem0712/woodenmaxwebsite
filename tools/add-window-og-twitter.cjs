/**
 * Ensure every aluminium-windows cluster page has OG + Twitter image tags.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'products/aluminium-windows');
const SITE = 'https://woodenmax.in';

function extractImage(html, slug) {
  let m =
    html.match(/<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i) ||
    html.match(/rel="preload"\s+as="image"\s+href="([^"]+)"/i) ||
    html.match(/"image":"(https:\/\/woodenmax\.in[^"]+)"/);
  if (m) {
    let u = m[1];
    if (u.startsWith('../../')) u = SITE + '/' + u.replace(/^\.\.\/\.\.\//, '');
    if (u.startsWith('../')) u = SITE + '/' + u.replace(/^\.\.\//, '');
    return u;
  }
  return `${SITE}/images/products/aluminium-windows/top-hung-aluminium-casement-window.webp`;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : 'WoodenMax Aluminium Windows';
}

function extractDesc(html) {
  const m = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  return m ? m[1].replace(/&amp;/g, '&') : '';
}

function extractCanonical(html, slug) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return m ? m[1] : `${SITE}/products/aluminium-windows/${slug}`;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function altFromTitle(title) {
  return title.replace(/\s*\|\s*WoodenMax.*$/i, '').replace(/\s*\(2026\).*$/i, '').trim();
}

function buildSocialBlock({ title, desc, url, image, alt }) {
  const d = esc(desc);
  const t = esc(title);
  const a = esc(alt);
  return `
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="WoodenMax" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="800" />
  <meta property="og:image:alt" content="${a}" />
  <meta property="og:locale" content="en_IN" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@woodenmax" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${a}" />`;
}

function patchFile(file) {
  const slug = path.basename(file, '.html');
  let html = fs.readFileSync(file, 'utf8');
  const title = extractTitle(html);
  const desc = extractDesc(html);
  const url = extractCanonical(html, slug);
  const image = extractImage(html, slug);
  const alt = altFromTitle(title);

  const hasOgImage = /<meta\s+property=["']og:image["']/i.test(html);
  const hasTwImage = /<meta\s+name=["']twitter:image["']/i.test(html);
  const hasOgWidth = /<meta\s+property=["']og:image:width["']/i.test(html);

  // Complete partial sets (og:image exists but missing twitter:site, alt, etc.)
  if (hasOgImage && hasTwImage) {
    let patched = false;
    if (!/<meta\s+name=["']twitter:site["']/i.test(html)) {
      html = html.replace(
        /(<meta\s+name=["']twitter:card["'][^>]*>)/i,
        `$1\n  <meta name="twitter:site" content="@woodenmax" />`
      );
      patched = true;
    }
    if (!/<meta\s+name=["']twitter:image:alt["']/i.test(html) && hasTwImage) {
      html = html.replace(
        /(<meta\s+name=["']twitter:image["'][^>]*>)/i,
        `$1\n  <meta name="twitter:image:alt" content="${esc(alt)}" />`
      );
      patched = true;
    }
    if (!hasOgWidth) {
      html = html.replace(
        /(<meta\s+property=["']og:image["'][^>]*>)/i,
        `$1\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="800" />\n  <meta property="og:image:alt" content="${esc(alt)}" />`
      );
      patched = true;
    }
    if (patched) {
      fs.writeFileSync(file, html);
      return 'patched-partial';
    }
    return 'skip';
  }

  const block = buildSocialBlock({ title, desc, url, image, alt });

  if (/<link\s+rel=["']canonical["']/i.test(html)) {
    html = html.replace(
      /(<link\s+rel=["']canonical["'][^>]*>)/i,
      `$1${block}`
    );
  } else if (/<meta\s+name=["']description["']/i.test(html)) {
    html = html.replace(
      /(<meta\s+name=["']description["'][^>]*>)/i,
      `$1${block}`
    );
  } else {
    html = html.replace(/<\/title>/i, `</title>${block}`);
  }

  fs.writeFileSync(file, html);
  return 'added';
}

const files = [...new Set(fs.readdirSync(DIR).filter((f) => f.endsWith('.html')))];
let added = 0,
  partial = 0;
for (const f of files) {
  const r = patchFile(path.join(DIR, f));
  if (r === 'added') {
    added++;
    console.log('+', f);
  } else if (r === 'patched-partial') {
    partial++;
    console.log('~', f);
  }
}
console.log('\nAdded full block:', added, '| Partial:', partial, '| Total:', files.length);
