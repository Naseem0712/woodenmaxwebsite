/**
 * url-architecture-audit.cjs
 * Redirect-aware crawl + dependency audit of the WoodenMax URL architecture.
 *
 * Why redirect-aware: _redirects rewrites (200) mean one HTML file can be served
 * at several URLs with DIFFERENT base directories. A relative href then resolves
 * to a different target per URL — that is exactly how duplicate/random crawl
 * paths get created. Absolute links are immune, which is what we are moving to.
 *
 * Nothing is modified. Output is the ground truth for the rewrite step.
 *
 * Run: node tools/url-architecture-audit.cjs            (summary)
 *      node tools/url-architecture-audit.cjs --full     (every violation)
 *      node tools/url-architecture-audit.cjs --json out.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'tools', 'GSC', 'SGC ISSUE', '_grills-source', 'terminals', '.snapshots', 'docs', 'server', 'lib']);
const FULL = process.argv.includes('--full');
const jsonIdx = process.argv.indexOf('--json');
const JSON_OUT = jsonIdx !== -1 ? process.argv[jsonIdx + 1] : null;

// ---------------------------------------------------------------- file scan
const htmlFiles = [];
const allFiles = new Set();
(function walk (dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) walk(p); }
    else {
      allFiles.add(rel(p));
      if (ent.name.toLowerCase().endsWith('.html')) htmlFiles.push(p);
    }
  }
})(ROOT);
function rel (p) { return path.relative(ROOT, p).replace(/\\/g, '/'); }

function deployedUrl (relPath) {
  if (relPath === 'index.html') return '/';
  if (relPath.endsWith('/index.html')) return '/' + relPath.slice(0, -'index.html'.length);
  return '/' + relPath.replace(/\.html$/i, '');
}
function baseDir (url) { return url.endsWith('/') ? url : url.slice(0, url.lastIndexOf('/') + 1); }

function resolveUrl (base, href) {
  const q = href.replace(/[?#].*$/, '');
  const segs = base.split('/').filter(Boolean);
  const trailing = q.endsWith('/');
  for (const part of q.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') { segs.pop(); continue; }   // clamps at root, like browsers
    segs.push(part);
  }
  return '/' + segs.join('/') + (trailing && segs.length ? '/' : '');
}

// ------------------------------------------------------------- _redirects
const redirects = [];   // {from, to, code}
const rpath = path.join(ROOT, '_redirects');
if (fs.existsSync(rpath)) {
  for (const line of fs.readFileSync(rpath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const parts = t.split(/\s+/);
    if (parts.length < 2) continue;
    const [from, to, code] = [parts[0], parts[1], parts[2] || '302'];
    if (from.includes('*') || /^https?:/i.test(from)) continue;   // splat/host rules
    redirects.push({ from, to, code: String(code) });
  }
}
const redirectFrom = new Map();          // from -> {to, code}  (first rule wins)
for (const r of redirects) if (!redirectFrom.has(r.from)) redirectFrom.set(r.from, r);

// url -> file, for files served directly
const urlToFile = new Map();
for (const f of htmlFiles) urlToFile.set(deployedUrl(rel(f)), rel(f));

function norm (u) { const c = u.split(/[?#]/)[0]; return c.length > 1 ? c.replace(/\/$/, '') : c; }

/** Follow 301/302 chains (max 5) to the final URL. */
function finalUrl (u) {
  let cur = u;
  for (let i = 0; i < 5; i++) {
    const r = redirectFrom.get(cur) || redirectFrom.get(norm(cur));
    if (!r) break;
    if (r.code === '200') return cur;         // rewrite: URL stays, content swapped
    if (r.to === cur) break;
    cur = r.to;
  }
  return cur;
}

/** Is this URL reachable (file, rewrite target, or redirect source)? */
function urlExists (u) {
  const clean = decodeURIComponent(u.split(/[?#]/)[0]);
  const candidates = [clean, norm(clean), clean.endsWith('/') ? clean : clean + '/'];
  for (const c of candidates) {
    if (urlToFile.has(c)) return true;
    if (redirectFrom.has(c)) return true;
    const asFile = c.replace(/^\//, '');
    if (allFiles.has(asFile)) return true;
    if (allFiles.has(asFile + '.html')) return true;
    if (allFiles.has(asFile + 'index.html')) return true;
  }
  return false;
}

/**
 * Every URL a given file is actually served at (its own clean URL plus any
 * 200-rewrite alias). These give the DIFFERENT bases a relative link sees.
 */
function servedUrlsFor (relPath) {
  const own = deployedUrl(relPath);
  const urls = new Set();
  const ownFinal = finalUrl(own);
  urls.add(ownFinal);
  for (const r of redirects) {
    if (r.code !== '200') continue;
    const target = norm(r.to.replace(/\.html$/i, '').replace(/\/index$/, '/'));
    if (target === norm(own) || r.to === '/' + relPath) urls.add(r.from);
  }
  return [...urls];
}

// ------------------------------------------------------------------- audit
const ATTR_RE = /\s(href|src)\s*=\s*"([^"]*)"/gi;
const CANON_RE = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/gi;
const ROBOTS_RE = /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
const EXTERNAL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function classify (h) {
  h = h.trim();
  if (!h) return 'empty';
  if (h.startsWith('#')) return 'hash';
  if (/^(?:mailto:|tel:|javascript:|data:)/i.test(h)) return 'scheme';
  if (h.startsWith('//')) return 'protocol-relative';
  if (EXTERNAL_RE.test(h)) return 'external';
  if (h.startsWith('/')) return 'root-absolute';
  return 'relative';
}

const R = {
  scannedPages: 0,
  links: { total: 0, relative: 0, rootAbsolute: 0, external: 0, hash: 0, scheme: 0 },
  multiBasePages: [],     // pages served at >1 URL (relative links are ambiguous there)
  ambiguousLinks: [],     // relative link that resolves differently per served URL
  brokenLinks: [],
  canonicalIssues: [],
  robotsIssues: [],
  perPageRelative: {},
  redirectIssues: [],
  sitemap: { total: 0, missing: [], notInSitemap: [], duplicates: [] }
};

/**
 * A 200 rewrite that serves a page under a base directory different from the
 * file's own only matters while that page still contains relative links —
 * absolute links resolve identically from any base. So this check runs after
 * the page scan and is filtered by real relative-link usage.
 */
function auditRedirects () {
  for (const r of redirects) {
    if (r.code !== '200') continue;
    const targetFile = r.to.replace(/^\//, '').replace(/\.html$/i, '');
    const page = Object.keys(R.perPageRelative).find(p =>
      p.replace(/\.html$/i, '').replace(/\/index$/, '') === targetFile.replace(/\/index$/, ''));
    const aliasBase = baseDir(r.from);
    const targetBase = baseDir(norm(r.to.replace(/\.html$/i, '')));
    if (aliasBase !== targetBase && page) {
      R.redirectIssues.push({
        rule: r.from + ' -> ' + r.to + ' 200',
        why: 'alias base "' + aliasBase + '" != page base "' + targetBase + '" and ' + page +
             ' still has ' + R.perPageRelative[page].length + ' relative link(s)'
      });
    }
    if (r.from.endsWith('/') && urlToFile.has(norm(r.from))) {
      R.redirectIssues.push({ rule: r.from + ' -> ' + r.to + ' 200', why: 'trailing-slash duplicate of ' + norm(r.from) + ' returns 200 (should be 301)' });
    }
  }
}

for (const f of htmlFiles) {
  const r = rel(f);
  const html = fs.readFileSync(f, 'utf8');
  const served = servedUrlsFor(r);
  const bases = [...new Set(served.map(baseDir))];
  R.scannedPages++;
  if (bases.length > 1) R.multiBasePages.push({ page: r, servedAt: served, bases });

  // canonical
  const canons = [...html.matchAll(CANON_RE)].map(m => m[1].trim());
  if (!canons.length) R.canonicalIssues.push({ page: r, issue: 'missing canonical' });
  else if (canons.length > 1) R.canonicalIssues.push({ page: r, issue: 'multiple canonicals', values: canons });
  else {
    const c = canons[0];
    if (!/^https:\/\/woodenmax\.in/i.test(c)) R.canonicalIssues.push({ page: r, issue: 'non-absolute/off-domain canonical', values: [c] });
    else {
      const cPath = norm(c.replace(/^https:\/\/woodenmax\.in/i, '') || '/');
      const okTargets = served.map(norm);
      if (!okTargets.includes(cPath)) R.canonicalIssues.push({ page: r, issue: 'canonical != served URL', values: [cPath, ...okTargets] });
    }
  }

  // robots
  const robots = [...html.matchAll(ROBOTS_RE)].map(m => m[1].trim());
  if (robots.length > 1) R.robotsIssues.push({ page: r, issue: 'multiple robots meta', values: robots });
  if (robots.some(v => /noindex/i.test(v))) R.robotsIssues.push({ page: r, issue: 'NOINDEX', values: robots });

  // links
  let m; ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(html))) {
    const attr = m[1].toLowerCase(), href = m[2], kind = classify(href);
    R.links.total++;
    if (R.links[kind === 'root-absolute' ? 'rootAbsolute' : kind] !== undefined) R.links[kind === 'root-absolute' ? 'rootAbsolute' : kind]++;
    if (kind !== 'relative' && kind !== 'root-absolute') continue;

    if (kind === 'root-absolute') {
      if (!urlExists(href)) R.brokenLinks.push({ page: r, attr, href, resolved: href, kind });
      continue;
    }

    const resolutions = [...new Set(bases.map(b => resolveUrl(b, href)))];
    const primary = resolveUrl(bases[0], href);
    (R.perPageRelative[r] = R.perPageRelative[r] || []).push({ attr, href, primary });
    if (resolutions.length > 1) {
      R.ambiguousLinks.push({ page: r, href, resolutions });
    }
    if (!urlExists(primary)) R.brokenLinks.push({ page: r, attr, href, resolved: primary, kind });
  }
}

auditRedirects();

// sitemap
const smPath = path.join(ROOT, 'sitemap.xml');
if (fs.existsSync(smPath)) {
  const xml = fs.readFileSync(smPath, 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  R.sitemap.total = locs.length;
  const seen = new Set(), inSm = new Set();
  for (const loc of locs) {
    if (seen.has(loc)) R.sitemap.duplicates.push(loc);
    seen.add(loc);
    const p = loc.replace(/^https:\/\/woodenmax\.in/i, '') || '/';
    inSm.add(norm(p));
    if (!urlExists(p)) R.sitemap.missing.push(loc);
    const fin = finalUrl(norm(p));
    if (norm(fin) !== norm(p)) R.sitemap.missing.push(loc + '  (redirects to ' + fin + ')');
  }
  for (const f of htmlFiles) {
    const rr = rel(f);
    const u = norm(servedUrlsFor(rr)[0]);
    if (/(^\/_|calculator-design-preview|^\/api\/)/.test(u)) continue;
    if (!inSm.has(u)) R.sitemap.notInSitemap.push(u + '   (' + rr + ')');
  }
}

// ------------------------------------------------------------------ output
function head (t, n) { console.log('\n' + '='.repeat(70) + '\n' + t + (n !== undefined ? ': ' + n : '') + '\n' + '='.repeat(70)); }
function list (a, n) {
  const lim = FULL ? a.length : (n || 15);
  a.slice(0, lim).forEach(x => console.log('  ' + (typeof x === 'string' ? x : JSON.stringify(x))));
  if (a.length > lim) console.log('  ... +' + (a.length - lim) + ' more (--full)');
}

head('SCAN SUMMARY');
console.log('  HTML pages              : ' + R.scannedPages);
console.log('  href/src attributes     : ' + R.links.total);
console.log('  RELATIVE (to convert)   : ' + R.links.relative);
console.log('  Root-absolute (ok)      : ' + R.links.rootAbsolute);
console.log('  External/scheme/hash    : ' + (R.links.external + R.links.scheme + R.links.hash));
console.log('  _redirects rules parsed : ' + redirects.length);

head('CRAWL EXPLOSION — pages served at more than one base URL', R.multiBasePages.length);
console.log('  Relative links on these pages resolve DIFFERENTLY per URL.');
list(R.multiBasePages.map(p => p.page + '  served at: ' + p.servedAt.join(' , ')), 20);

head('CRAWL EXPLOSION — relative links with ambiguous resolution', R.ambiguousLinks.length);
list(R.ambiguousLinks.map(a => a.page + '  href="' + a.href + '"  ->  ' + a.resolutions.join('  ||  ')), 30);

head('_redirects RULES THAT CREATE DUPLICATES', R.redirectIssues.length);
list(R.redirectIssues.map(x => x.rule + '\n      ' + x.why), 20);

head('BROKEN LINKS (target unreachable)', R.brokenLinks.length);
list(R.brokenLinks.map(b => b.page + '  [' + b.kind + '/' + b.attr + '] "' + b.href + '" -> ' + b.resolved), 40);

head('CANONICAL ISSUES', R.canonicalIssues.length);
list(R.canonicalIssues.map(c => c.page + '  ' + c.issue + (c.values ? '  ' + JSON.stringify(c.values) : '')), 25);

head('ROBOTS ISSUES', R.robotsIssues.length);
list(R.robotsIssues.map(c => c.page + '  ' + c.issue), 20);

head('SITEMAP');
console.log('  URLs: ' + R.sitemap.total + ' | unreachable/redirecting: ' + R.sitemap.missing.length +
            ' | duplicates: ' + R.sitemap.duplicates.length + ' | live pages missing: ' + R.sitemap.notInSitemap.length);
list(R.sitemap.missing, 20);
list(R.sitemap.notInSitemap, 20);

if (JSON_OUT) { fs.writeFileSync(path.join(ROOT, JSON_OUT), JSON.stringify(R, null, 2)); console.log('\nJSON -> ' + JSON_OUT); }
