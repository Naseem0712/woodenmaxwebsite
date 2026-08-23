#!/usr/bin/env node
/**
 * tools/fix-seo-urls.cjs
 * - 301 redirects: every *.html → clean URL (kept in the static _redirects section)
 * - Internal links: strip .html from hrefs in HTML + JS
 * - robots.txt: block Cloudflare junk + parameterized contact URLs
 *
 * Run: node tools/fix-seo-urls.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry');
const REDIRECTS_ONLY = process.argv.includes('--redirects-only');
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SKIP_DIRS = new Set(['node_modules', '.git', 'mcps', 'agent-transcripts', 'terminals', '.snapshots', '_grills-source']);
const SKIP_HTML = new Set(['calculator-design-preview.html', 'api/calculate/index.html']);
const MANAGED_HUB_HTML = new Set([
  'products/pergola.html',
  'products/pergola/index.html',
  'products/metal-louvers.html',
  'products/metal-louvers/index.html',
  // The live historical identity for this directory hub is the trailing-slash URL.
  'products/mirror-profiles/index.html',
]);

let stats = { redirects: 0, filesPatched: 0, hrefFixes: 0 };

function walkHtml(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function cleanUrlFromHtml(relPosix) {
  if (relPosix === 'index.html') return '/';
  if (relPosix === 'products/pergola/index.html') return '/products/pergola';
  if (relPosix === 'products/metal-louvers/index.html') return '/products/metal-louvers';
  return '/' + relPosix.replace(/\.html$/, '');
}

function buildRedirectRules(htmlFiles, allowedSources) {
  const lines = [];
  const seenSources = new Set();

  const add = (from, to) => {
    if (!allowedSources.has(from)) return;
    if (seenSources.has(from)) return;
    seenSources.add(from);
    lines.push(`${from} ${to} 301`);
    stats.redirects++;
  };

  for (const abs of htmlFiles) {
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (SKIP_HTML.has(rel) || MANAGED_HUB_HTML.has(rel)) continue;
    const clean = cleanUrlFromHtml(rel);
    add('/' + rel, clean);
    add('/' + rel + '/', clean);
    if (rel !== 'index.html') {
      add(clean + '.html', clean);
      add(clean + '.html/', clean);
    }
  }

  add('/index.html', '/');
  add('/index.html/', '/');
  add('/contact.html', '/contact');
  add('/contact.html/', '/contact');
  add('/blog.html', '/blog');
  add('/blog.html/', '/blog');
  add('/about.html', '/about');
  add('/about.html/', '/about');
  add('/catalog.html', '/catalog');
  add('/calculators.html', '/calculators');
  add('/return-policy.html', '/return-policy');

  return lines.sort();
}

function autoManagedSources() {
  const content = fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8');
  const marker = '# AUTO: .html → clean URL (fix-seo-urls.cjs)';
  const endMarker = '# END AUTO: .html → clean URL';
  const start = content.indexOf(marker);
  const end = content.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return new Set();
  return new Set(
    content
      .slice(start + marker.length, end)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split(/\s+/)[0])
  );
}

function mergeRedirects(newRules) {
  const file = path.join(ROOT, '_redirects');
  let content = fs.readFileSync(file, 'utf8');
  const marker = '# AUTO: .html → clean URL (fix-seo-urls.cjs)';
  const endMarker = '# END AUTO: .html → clean URL';

  if (content.includes(marker)) {
    content = content.replace(
      new RegExp(`${escapeRegExp(marker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\r?\\n?`, 'g'),
      ''
    );
  }

  const existingSources = new Set(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split(/\s+/)[0])
  );
  const uniqueRules = newRules.filter((rule) => !existingSources.has(rule.split(/\s+/)[0]));
  const block = [
    '',
    marker,
    ...uniqueRules,
    endMarker,
    '',
  ].join('\n');

  const dynamicMarker = '# GSC junk URL cleanup (relative-link crawl pollution + wrong slugs)';
  const insertion = content.indexOf(dynamicMarker);
  const next = insertion === -1
    ? content.trimEnd() + block
    : content.slice(0, insertion).trimEnd() + block + '\n' + content.slice(insertion);
  if (!DRY) fs.writeFileSync(file, next, 'utf8');
}

/** Strip .html from href: '…' constants in site-nav.js / site-footer.js (not matched by href= regex). */
function fixJsHrefConstants(text) {
  let n = 0;
  const next = text.replace(/href:\s*(['"])([^'"]+)\1/g, (full, q, href) => {
    if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return full;
    if (!/\.html/i.test(href)) return full;
    const fixed = href
      .replace(/index\.html(?=[?#]|$)/gi, 'index')
      .replace(/\.html(?=[?#]|$)/gi, () => {
        n++;
        return '';
      });
    if (fixed === href) return full;
    return `href: ${q}${fixed}${q}`;
  });
  stats.hrefFixes += n;
  return next;
}

function fixInternalLinks(text) {
  let n = 0;
  const next = text.replace(/href=(["'])([^"']+)\1/gi, (full, q, href) => {
    if (/^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return full;
    if (!/\.html/i.test(href)) return full;
    const fixed = href
      .replace(/index\.html(?=[?#]|$)/gi, '')
      .replace(/\.html(?=[?#]|$)/gi, () => {
        n++;
        return '';
      });
    if (fixed === href) return full;
    return `href=${q}${fixed}${q}`;
  });
  stats.hrefFixes += n;
  return next;
}

function patchFiles() {
  const htmlFiles = walkHtml(ROOT, []);
  const jsFiles = ['js/site-nav.js', 'js/site-footer.js', 'js/seo-enhancer.js'].map((f) =>
    path.join(ROOT, f)
  ).filter((f) => fs.existsSync(f));

  for (const abs of [...htmlFiles, ...jsFiles]) {
    const rel = path.relative(ROOT, abs);
    if (SKIP_HTML.has(rel)) continue;
    let text = fs.readFileSync(abs, 'utf8');
    let next = fixInternalLinks(text);
    if (/site-(nav|footer)\.js$/i.test(rel)) {
      next = fixJsHrefConstants(next);
    }
    if (next !== text) {
      stats.filesPatched++;
      if (!DRY) fs.writeFileSync(abs, next, 'utf8');
    }
  }
}

function patchRobots() {
  const file = path.join(ROOT, 'robots.txt');
  let t = fs.readFileSync(file, 'utf8');
  const marker = '# SEO: block duplicate / technical URLs';
  if (t.includes(marker)) return;

  const block = `
${marker}
Disallow: /cdn-cgi/
Disallow: /contact?
Disallow: /contact?
Disallow: /search?
`;

  const insertAt = t.indexOf('Disallow: /admin/');
  if (insertAt === -1) {
    t += block;
  } else {
    t = t.slice(0, insertAt) + block.trim() + '\n' + t.slice(insertAt);
  }
  if (!DRY) fs.writeFileSync(file, t, 'utf8');
}

function patchContactNoindex() {
  const file = path.join(ROOT, 'contact.html');
  let t = fs.readFileSync(file, 'utf8');
  const snippet = `  <!-- noindex parameterized contact URLs (GSC duplicate cleanup) -->
  <script>
  (function(){if(location.search){var m=document.createElement('meta');m.name='robots';m.content='noindex,follow';document.head.appendChild(m);}})();
  </script>`;
  if (t.includes('noindex parameterized contact')) return;
  t = t.replace(/<\/head>/i, snippet + '\n</head>');
  if (!DRY) fs.writeFileSync(file, t, 'utf8');
}

function main() {
  console.log(`\nfix-seo-urls ${DRY ? '(DRY)' : ''}\n`);
  const htmlFiles = walkHtml(ROOT, []);
  const rules = buildRedirectRules(htmlFiles, autoManagedSources());
  mergeRedirects(rules);
  if (REDIRECTS_ONLY) {
    console.log(`Redirects added : ${stats.redirects}`);
    console.log(DRY ? '\n(dry run)\n' : '\nDone.\n');
    return;
  }
  patchFiles();
  patchRobots();
  patchContactNoindex();
  console.log(`Redirects added : ${stats.redirects}`);
  console.log(`Files patched   : ${stats.filesPatched}`);
  console.log(`href .html fixes: ${stats.hrefFixes}`);
  console.log(DRY ? '\n(dry run)\n' : '\nDone.\n');
}

main();
