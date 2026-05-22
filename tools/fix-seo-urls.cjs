#!/usr/bin/env node
/**
 * tools/fix-seo-urls.cjs
 * - 301 redirects: every *.html → clean URL (append to _redirects)
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

const SKIP_DIRS = new Set(['node_modules', '.git', 'mcps', 'agent-transcripts', 'terminals', '.snapshots', '_grills-source']);
const SKIP_HTML = new Set(['calculator-design-preview.html', 'api/calculate/index.html']);

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
  return '/' + relPosix.replace(/\.html$/, '');
}

function buildRedirectRules(htmlFiles) {
  const lines = [];
  const seen = new Set();

  const add = (from, to) => {
    const key = from + '→' + to;
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(`${from} ${to} 301`);
    stats.redirects++;
  };

  for (const abs of htmlFiles) {
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (SKIP_HTML.has(rel)) continue;
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

function mergeRedirects(newRules) {
  const file = path.join(ROOT, '_redirects');
  let content = fs.readFileSync(file, 'utf8');
  const marker = '# AUTO: .html → clean URL (fix-seo-urls.cjs)';
  const endMarker = '# END AUTO: .html → clean URL';

  if (content.includes(marker)) {
    content = content.replace(
      new RegExp(`${marker}[\\s\\S]*?${endMarker}\\n?`, 'm'),
      ''
    );
  }

  const block = [
    '',
    marker,
    'http://woodenmax.in/* https://woodenmax.in/:splat 301',
    'http://www.woodenmax.in/* https://woodenmax.in/:splat 301',
    ...newRules,
    endMarker,
    '',
  ].join('\n');

  if (!DRY) fs.writeFileSync(file, content.trimEnd() + block, 'utf8');
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
Disallow: /contact.html?
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
  const rules = buildRedirectRules(htmlFiles);
  mergeRedirects(rules);
  patchFiles();
  patchRobots();
  patchContactNoindex();
  console.log(`Redirects added : ${stats.redirects}`);
  console.log(`Files patched   : ${stats.filesPatched}`);
  console.log(`href .html fixes: ${stats.hrefFixes}`);
  console.log(DRY ? '\n(dry run)\n' : '\nDone.\n');
}

main();
