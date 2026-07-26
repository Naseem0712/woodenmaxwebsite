/**
 * absolutize-urls.cjs
 * Converts every RELATIVE href/src in the HTML to a root-absolute URL.
 *
 * Safety rules (nothing is guessed):
 *  - Only attribute values inside real HTML tags are touched. Script bodies,
 *    JSON-LD, inline JS and text content are never rewritten.
 *  - A relative link is resolved against the page's own directory (the base the
 *    author wrote it for), then the target is checked against the real file
 *    tree + _redirects. Only verified targets are rewritten.
 *  - If a target cannot be verified, the link is LEFT UNTOUCHED and reported
 *    under "unresolved" so it can be fixed by hand.
 *  - Links that would land on a 301 are pointed straight at the final URL, so
 *    internal links never burn a redirect hop.
 *  - Query strings and #fragments are preserved byte-for-byte.
 *
 * Run: node tools/absolutize-urls.cjs            (dry run + report)
 *      node tools/absolutize-urls.cjs --apply
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const SKIP_DIRS = new Set(['node_modules', '.git', '.github', 'tools', 'GSC', 'SGC ISSUE', '_grills-source', 'terminals', '.snapshots', 'docs', 'server', 'lib']);

// ------------------------------------------------------------- file tree
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

function deployedUrl (r) {
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'index.html'.length);
  return '/' + r.replace(/\.html$/i, '');
}
function baseDir (u) { return u.endsWith('/') ? u : u.slice(0, u.lastIndexOf('/') + 1); }
function norm (u) { const c = u.split(/[?#]/)[0]; return c.length > 1 ? c.replace(/\/$/, '') : c; }

function resolvePath (base, p) {
  const segs = base.split('/').filter(Boolean);
  const trailing = p.endsWith('/');
  for (const part of p.split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') { segs.pop(); continue; }
    segs.push(part);
  }
  return '/' + segs.join('/') + (trailing && segs.length ? '/' : '');
}

// ------------------------------------------------------------- _redirects
const redirects = [];
for (const line of fs.readFileSync(path.join(ROOT, '_redirects'), 'utf8').split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const parts = t.split(/\s+/);
  if (parts.length < 2 || parts[0].includes('*') || /^https?:/i.test(parts[0])) continue;
  redirects.push({ from: parts[0], to: parts[1], code: String(parts[2] || '302') });
}
const redirectFrom = new Map();
for (const r of redirects) if (!redirectFrom.has(r.from)) redirectFrom.set(r.from, r);

const urlToFile = new Map();
for (const f of htmlFiles) urlToFile.set(deployedUrl(rel(f)), rel(f));

/** Follow 301/302 to the final URL a browser/crawler ends on. */
function finalUrl (u) {
  let cur = u;
  for (let i = 0; i < 6; i++) {
    const r = redirectFrom.get(cur) || redirectFrom.get(norm(cur));
    if (!r || r.code === '200') break;
    if (r.to === cur) break;
    cur = r.to;
  }
  return cur;
}

function exists (u) {
  const clean = decodeURIComponent(u.split(/[?#]/)[0]);
  for (const c of [clean, norm(clean), clean.endsWith('/') ? clean : clean + '/']) {
    if (urlToFile.has(c)) return true;
    if (redirectFrom.has(c)) return true;
    const asFile = c.replace(/^\//, '');
    if (allFiles.has(asFile) || allFiles.has(asFile + '.html') || allFiles.has(asFile + 'index.html')) return true;
  }
  return false;
}

// ------------------------------------------------------------- rewriting
// Match a complete HTML start tag, respecting quoted attribute values so a ">"
// inside an attribute cannot terminate the tag early.
const TAG_RE = /<[a-zA-Z][a-zA-Z0-9-]*(?:"[^"]*"|'[^']*'|[^>"'])*>/g;
// data-image drives the product gallery lightbox and is resolved by the browser
// exactly like src, so it has the same ambiguity problem and is included here.
const ATTR_RE = /(\s(?:href|src|data-image|data-src|data-bg|poster|action|formaction)\s*=\s*")([^"]*)(")/gi;
const EXTERNAL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function isRelative (h) {
  const v = h.trim();
  if (!v) return false;
  if (v.startsWith('#') || v.startsWith('?')) return false;
  if (v.startsWith('/')) return false;
  if (EXTERNAL_RE.test(v)) return false;
  return true;
}

const stats = {
  filesChanged: 0, relativeRewritten: 0, hopsShortened: 0,
  unresolved: [], perFile: {}
};

for (const f of htmlFiles) {
  const r = rel(f);
  const src = fs.readFileSync(f, 'utf8');
  const base = baseDir(deployedUrl(r));
  let fileCount = 0, hop = 0;

  const out = src.replace(TAG_RE, (tag) => tag.replace(ATTR_RE, (m, pre, value, post) => {
    // Split off query/#fragment so they survive untouched.
    const cut = value.search(/[?#]/);
    const rawPath = cut === -1 ? value : value.slice(0, cut);
    const suffix  = cut === -1 ? ''    : value.slice(cut);

    if (!isRelative(value)) {
      // already root-absolute: only collapse a redirect hop
      if (value.startsWith('/') && rawPath) {
        const fin = finalUrl(norm(rawPath));
        if (norm(fin) !== norm(rawPath) && exists(fin)) { hop++; return pre + fin + suffix + post; }
      }
      return m;
    }

    const resolved = resolvePath(base, rawPath);
    if (!exists(resolved)) {
      stats.unresolved.push({ page: r, href: value, wouldBe: resolved });
      return m;                                   // never guess — leave as-is
    }
    let target = finalUrl(resolved);
    if (!exists(target)) target = resolved;
    if (norm(target) !== norm(resolved)) hop++;
    fileCount++;
    return pre + target + suffix + post;
  }));

  if (out !== src) {
    stats.filesChanged++;
    stats.relativeRewritten += fileCount;
    stats.hopsShortened += hop;
    stats.perFile[r] = fileCount;
    if (APPLY) fs.writeFileSync(f, out);
  }
}

// ------------------------------------------------------------------ report
console.log('\n' + (APPLY ? 'APPLIED' : 'DRY RUN') + ' — absolutize-urls');
console.log('  Files changed          : ' + stats.filesChanged);
console.log('  Relative -> absolute   : ' + stats.relativeRewritten);
console.log('  Redirect hops removed  : ' + stats.hopsShortened);
console.log('  UNRESOLVED (left as-is): ' + stats.unresolved.length);

const grouped = {};
for (const u of stats.unresolved) (grouped[u.page] = grouped[u.page] || []).push(u.href + '  ->  ' + u.wouldBe);
const pages = Object.keys(grouped).sort();
if (pages.length) {
  console.log('\n--- UNRESOLVED LINKS (need a human decision) ---');
  for (const p of pages) {
    console.log('  ' + p);
    [...new Set(grouped[p])].forEach(x => console.log('      ' + x));
  }
}
fs.writeFileSync(path.join(ROOT, 'tools/absolutize-unresolved.json'), JSON.stringify(stats.unresolved, null, 2));
console.log('\nUnresolved detail -> tools/absolutize-unresolved.json');
