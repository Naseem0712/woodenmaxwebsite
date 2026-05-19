/**
 * tools/rebuild-sitemap.cjs
 *
 * Crawls the repo filesystem and writes a fresh `sitemap.xml` + `sitemap-images.xml`.
 * Every HTML page (except design previews and source-only files) is added with:
 *   - <loc>           — canonical URL (https://woodenmax.in/<path-without-html-or-trailing-slash>)
 *   - <lastmod>       — file mtime (or today, whichever is later)
 *   - <changefreq>    — heuristic: hubs = weekly, money pages = weekly, EEAT = monthly, policies = monthly, blog = monthly
 *   - <priority>      — 1.0 home, 0.9 hubs, 0.85 money, 0.8 product child pages, 0.7 EEAT/cluster, 0.6 policies/blog, 0.5 misc
 *
 * Run:  node tools/rebuild-sitemap.cjs
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = 'https://woodenmax.in';

const SKIP_FILES = new Set([
  'calculator-design-preview.html',
  '_grills-source/index.html',
  '404.html',
  'api/calculate/index.html'
]);
const SKIP_DIRS = new Set(['node_modules', '.git', 'tools', 'mcps', 'agent-transcripts', 'terminals', '_grills-source']);

function listHtml (dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      listHtml(p, out);
    } else if (e.isFile() && e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function urlFor (htmlAbs) {
  const rel = path.relative(ROOT, htmlAbs).split(path.sep).join('/');
  if (rel === 'index.html') return BASE + '/';
  // Strip ".html" — site supports clean URLs on the production domain.
  return BASE + '/' + rel.replace(/\.html$/, '');
}

function priorityFor (rel) {
  if (rel === 'index.html') return '1.0';
  if (/^products\/[^/]+\.html$/.test(rel)) return '0.9';                  // product hubs
  if (/^city\/[^/]+\.html$/.test(rel))     return '0.85';                 // city landings
  if (/-price-(bangalore|mumbai|delhi|pune)\.html$/.test(rel)) return '0.85'; // money pages
  if (/^products\/.+\/.+\.html$/.test(rel)) return '0.8';                 // product child
  if (/^about\//.test(rel))    return '0.7';                               // EEAT
  if (/^policies\//.test(rel)) return '0.65';                              // policies
  if (/^blog\//.test(rel))     return '0.6';
  if (/calculator/.test(rel))  return '0.85';
  if (/^api\//.test(rel))      return '0.8';
  return '0.5';
}

function changefreqFor (rel) {
  if (rel === 'index.html')                                          return 'weekly';
  if (/^products\/[^/]+\.html$/.test(rel))                           return 'weekly';
  if (/-price-/.test(rel))                                           return 'weekly';
  if (/^about\//.test(rel))                                          return 'monthly';
  if (/^policies\//.test(rel))                                       return 'monthly';
  if (/^blog\//.test(rel))                                           return 'monthly';
  if (/calculator/.test(rel))                                        return 'weekly';
  return 'monthly';
}

function isoDate (htmlAbs) {
  try {
    const stat = fs.statSync(htmlAbs);
    return stat.mtime.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
}

function discoverImages (htmlAbs) {
  // Grab all <img src=…> and meta og:image hrefs that look like absolute paths.
  const html = fs.readFileSync(htmlAbs, 'utf8');
  const set = new Set();
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/);
  if (ogMatch && ogMatch[1]) set.add(ogMatch[1]);
  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)];
  for (const m of imgs) {
    let s = m[1];
    if (s.startsWith('data:')) continue;
    if (s.startsWith('//')) s = 'https:' + s;
    if (!/^https?:\/\//.test(s)) {
      // resolve relative path against page location
      const rel = path.relative(ROOT, htmlAbs).split(path.sep).join('/');
      const fromDir = path.dirname(rel);
      let absRel = path.posix.normalize(path.posix.join(fromDir, s));
      s = BASE + '/' + absRel.replace(/^\/+/, '');
    }
    if (/\.(webp|jpe?g|png|gif|svg)(\?|$)/i.test(s)) set.add(s);
  }
  return [...set].slice(0, 25); // cap to 25 images per URL per sitemap spec recommendation
}

function escapeXml (s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function main () {
  const files = listHtml(ROOT)
    .map(f => ({ abs: f, rel: path.relative(ROOT, f).split(path.sep).join('/') }))
    .filter(o => !SKIP_FILES.has(o.rel))
    .sort((a, b) => a.rel.localeCompare(b.rel));

  const extraSitemapUrls = [
    { loc: BASE + '/api/calculate', priority: '0.8', changefreq: 'monthly' },
    { loc: BASE + '/llms.txt', priority: '0.6', changefreq: 'monthly' },
  ];

  // --------- sitemap.xml ---------
  const urlNodes = files.map(o => (
    '  <url>\n' +
    '    <loc>' + escapeXml(urlFor(o.abs)) + '</loc>\n' +
    '    <lastmod>' + isoDate(o.abs) + '</lastmod>\n' +
    '    <changefreq>' + changefreqFor(o.rel) + '</changefreq>\n' +
    '    <priority>' + priorityFor(o.rel) + '</priority>\n' +
    '  </url>'
  )).concat(extraSitemapUrls.map(function (u) {
    return (
      '  <url>\n' +
      '    <loc>' + escapeXml(u.loc) + '</loc>\n' +
      '    <lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod>\n' +
      '    <changefreq>' + u.changefreq + '</changefreq>\n' +
      '    <priority>' + u.priority + '</priority>\n' +
      '  </url>'
    );
  })).join('\n');

  const sitemap =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    urlNodes + '\n' +
    '</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

  // --------- sitemap-images.xml ---------
  let withImages = 0;
  const imageNodes = files.map(o => {
    const imgs = discoverImages(o.abs);
    if (!imgs.length) return null;
    withImages++;
    return (
      '  <url>\n' +
      '    <loc>' + escapeXml(urlFor(o.abs)) + '</loc>\n' +
      imgs.map(i =>
        '    <image:image>\n' +
        '      <image:loc>' + escapeXml(i) + '</image:loc>\n' +
        '    </image:image>'
      ).join('\n') + '\n' +
      '  </url>'
    );
  }).filter(Boolean).join('\n');

  const sitemapImg =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    imageNodes + '\n' +
    '</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap-images.xml'), sitemapImg, 'utf8');

  console.log('✓ sitemap.xml         ' + files.length + ' URLs');
  console.log('✓ sitemap-images.xml  ' + withImages   + ' URLs with images');

  // ALL_URLS.txt — flat list for GSC bulk indexing
  const extraUrls = [
    BASE + '/api/calculate',
    BASE + '/tools/woodenmax-widget.js',
    BASE + '/llms.txt',
    BASE + '/data/pricing-engine.js',
  ];
  const allUrls = files.map(function (o) { return urlFor(o.abs); }).concat(extraUrls);
  const unique = [...new Set(allUrls)].sort();
  const allUrlsTxt =
    '# WoodenMax — Complete Site URL Index (auto-generated)\n' +
    '# Last run: ' + new Date().toISOString().split('T')[0] + '\n' +
    '# Total URLs: ' + unique.length + '\n\n' +
    unique.map(function (u) { return u; }).join('\n') + '\n';
  fs.writeFileSync(path.join(ROOT, 'ALL_URLS.txt'), allUrlsTxt, 'utf8');
  console.log('✓ ALL_URLS.txt         ' + unique.length + ' URLs');

  // Always keep llms.txt / llms-full.txt in lockstep with the sitemap.
  try {
    require('./build-llms-txt.cjs');
  } catch (e) {
    console.warn('⚠ Could not refresh llms.txt: ' + e.message);
  }
}

main();
