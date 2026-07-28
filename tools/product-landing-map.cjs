/**
 * Resolve product id → live HTML landing path (no .html) by scanning the site.
 * Prefer pages whose data-product matches the calculator id.
 * Never invent URLs that soft-404.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function walkHtml(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkHtml(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function toCleanPath(absHtml) {
  const rel = path.relative(ROOT, absHtml).replace(/\\/g, '/');
  return '/' + rel.replace(/\.html$/i, '');
}

function scoreLanding(cleanPath, productId, slug) {
  const base = cleanPath.split('/').pop() || '';
  let score = 0;
  if (slug && base === slug) score += 100;
  if (base === productId) score += 80;
  // Prefer primary product hubs over thin SEO mirrors
  if (/price-calculator|seo-/i.test(base)) score -= 40;
  if (/aluminium-sliding-window$/.test(cleanPath) && productId === '29mm-sliding') score += 50;
  if (/aluminium-system-window-price$/.test(cleanPath) && productId === 'system-sliding-30mm') score += 50;
  if (/3-track-sliding-window$|domal-window-price$/.test(cleanPath) && productId === '3track-sliding') score += 40;
  if (/hpl-acp-elevation-cladding$/.test(cleanPath) && productId === 'acp-elevation') score += 50;
  // Prefer shorter paths slightly
  score -= Math.min(20, cleanPath.split('/').length);
  return score;
}

/**
 * @returns {{ byId: Record<string,string>, bySlug: Record<string,string>, pagesByProduct: Record<string,string[]> }}
 */
function buildProductLandingMap() {
  const uniq = walkHtml(path.join(ROOT, 'products'));
  const pagesByProduct = {};

  const re = /data-product\s*=\s*["']([^"']+)["']/gi;
  for (const file of uniq) {
    const html = fs.readFileSync(file, 'utf8');
    let m;
    const found = new Set();
    while ((m = re.exec(html))) found.add(m[1].trim());
    const clean = toCleanPath(file);
    found.forEach((pid) => {
      if (!pagesByProduct[pid]) pagesByProduct[pid] = [];
      if (!pagesByProduct[pid].includes(clean)) pagesByProduct[pid].push(clean);
    });
  }

  let products = [];
  try {
    products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8')).products || [];
  } catch (e) {
    products = [];
  }

  const byId = {};
  const bySlug = {};

  products.forEach((p) => {
    const candidates = pagesByProduct[p.id] || [];
    // Also accept file that matches slug on disk even without data-product (rare)
    const slugPath = p.category && p.slug
      ? `/products/${p.category}/${p.slug}`
      : null;
    if (slugPath) {
      const disk = path.join(ROOT, slugPath.slice(1) + '.html');
      if (fs.existsSync(disk) && !candidates.includes(slugPath)) candidates.push(slugPath);
    }
    if (!candidates.length) return;
    candidates.sort((a, b) => scoreLanding(b, p.id, p.slug) - scoreLanding(a, p.id, p.slug));
    const best = candidates[0];
    byId[p.id] = best;
    if (p.slug) bySlug[p.slug] = best;
  });

  // Mirror catalog
  const mirrorLanding = '/products/mirror-profiles/mirror-profile-price-per-foot';
  if (fs.existsSync(path.join(ROOT, mirrorLanding.slice(1) + '.html'))) {
    byId['mirror-bevel-modular'] = mirrorLanding;
    bySlug['mirror-profile-price-per-foot'] = mirrorLanding;
  }

  return { byId, bySlug, pagesByProduct };
}

function landingExists(cleanPath) {
  if (!cleanPath) return false;
  const disk = path.join(ROOT, cleanPath.replace(/^\//, '').replace(/\//g, path.sep) + '.html');
  return fs.existsSync(disk);
}

module.exports = {
  ROOT,
  buildProductLandingMap,
  landingExists,
  toCleanPath
};

if (require.main === module) {
  const map = buildProductLandingMap();
  const missing = (JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'products.json'), 'utf8')).products || [])
    .filter((p) => p.status !== 'inactive' && !map.byId[p.id])
    .map((p) => p.id);
  console.log(JSON.stringify({ mapped: Object.keys(map.byId).length, missing }, null, 2));
}
