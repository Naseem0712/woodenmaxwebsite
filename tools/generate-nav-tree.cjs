/**
 * Build js/nav-tree.js — mobile drawer labels (short, distinct, no SEO boilerplate).
 * Run: node tools/generate-nav-tree.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSV = path.join(ROOT, 'products-feed.csv');
const OUT = path.join(ROOT, 'js/nav-tree.js');

const HUBS = [
  { slug: 'aluminium-windows', label: 'Aluminium Windows', href: 'products/aluminium-windows' },
  { slug: 'telescope-windows', label: 'Telescopic Doors', href: 'products/telescope-windows' },
  { slug: 'folding-systems', label: 'Folding Systems', href: 'products/folding-systems' },
  { slug: 'pergola', label: 'Pergolas', href: 'products/pergola' },
  { slug: 'metal-louvers', label: 'Metal Louvers', href: 'products/metal-louvers' },
  { slug: 'mirror-profiles', label: 'Mirror Profiles', href: 'products/mirror-profiles/' },
  { slug: 'shower-partitions', label: 'Shower Partitions', href: 'products/shower-partitions' },
  { slug: 'elevation-cladding', label: 'Elevation Cladding', href: 'products/elevation-cladding' },
  { slug: 'glass-elevation', label: 'Glass Elevation', href: 'products/glass-elevation' },
  { slug: 'glass-railing', label: 'Glass Railing', href: 'products/glass-railing' },
  { slug: 'grills', label: 'Safety Grills', href: 'products/grills' }
];

const SITE_LINKS = [
  { label: 'Product catalog', href: 'catalog' },
  { label: 'All calculators', href: 'calculators' },
  { label: 'About WoodenMax', href: 'about' },
  { label: 'Case studies', href: 'about/case-study-makobrew-jubilee-hills' },
  { label: 'Contact / site visit', href: 'contact' },
  { label: 'Warranty policy', href: 'policies/warranty-policy' },
  { label: 'GST & transport', href: 'policies/gst-transport-policy' }
];

const BLOG_LABEL_OVERRIDES = {
  'aluminium-sliding-glass-door-complete-guide': 'Sliding glass door guide',
  'complete-woodenmax-products-guide': 'Full product guide',
  'energy-efficient-windows-guide': 'Energy-efficient windows',
  'frameless-sliding-doors-interior-partitions': 'Frameless sliding doors',
  'pergola-design-ideas-india': 'Pergola design ideas',
  'sliding-window-vs-folding-door-comparison': 'Sliding vs folding door',
  'soundproof-windows-Hyderabad': 'Soundproof windows (Hyd)',
  'window-maintenance-tips': 'Window maintenance tips'
};

const CITY_HUB_SLUGS = ['bangalore', 'delhi', 'hyderabad', 'jaipur', 'lucknow', 'mumbai', 'pune'];

const CITY_NAMES = {
  bangalore: 'Bengaluru',
  delhi: 'Delhi NCR',
  mumbai: 'Mumbai',
  pune: 'Pune',
  hyderabad: 'Hyderabad',
  jaipur: 'Jaipur',
  chandigarh: 'Chandigarh',
  vijayawada: 'Vijayawada',
  visakhapatnam: 'Visakhapatnam',
  warangal: 'Warangal'
};

function detectCityEntry(id, href) {
  if (/^city\//.test(href)) {
    var slug = href.replace(/^city\//, '');
    return {
      group: 'hub',
      label: (CITY_NAMES[slug] || slugLabel(slug)) + ' hub',
      href: href,
      sortKey: '0-' + slug
    };
  }
  if (/^aluminium-window-price-/.test(id)) {
    var cw = id.replace('aluminium-window-price-', '');
    return { group: 'windows', label: 'Windows — ' + (CITY_NAMES[cw] || slugLabel(cw)), href: href, sortKey: '1-' + cw };
  }
  if (/^glass-elevation-price-/.test(id)) {
    var cg = id.replace('glass-elevation-price-', '');
    return { group: 'glass', label: 'Glass — ' + (CITY_NAMES[cg] || slugLabel(cg)), href: href, sortKey: '2-' + cg };
  }
  if (/^louver-price-/.test(id)) {
    var cl = id.replace('louver-price-', '');
    return { group: 'louvers', label: 'Louvers — ' + (CITY_NAMES[cl] || slugLabel(cl)), href: href, sortKey: '3-' + cl };
  }
  if (id === 'led-mirror-profile-delhi') {
    return { group: 'mirrors', label: 'Mirrors — Delhi NCR', href: href, sortKey: '4-delhi' };
  }
  if (id === 'led-mirror-profile-hyderabad') {
    return { group: 'mirrors', label: 'Mirrors — Hyderabad', href: href, sortKey: '4-hyderabad' };
  }
  return null;
}

/** Short nav labels — one distinct name per page (not SEO titles). Key = page id / filename stem. */
const NAV_LABEL_OVERRIDES = {
  // Aluminium windows — calculators
  '2-track-aluminium-window-price': '2-track sliding (29 mm)',
  '3-track-sliding-window': '3-track Domal sliding',
  '4-track-sliding-window-price': '4-track wide opening',
  'aluminium-casement-window-price': 'Casement openable',
  'aluminium-sliding-window': 'Premium sliding (29 mm)',
  'aluminium-sliding-window-price-calculator': 'Premium sliding calculator',
  'aluminium-system-window-price': 'System window',
  'system-sliding-window-price': 'System sliding',
  'system-casement-window-price': 'System casement',
  'slim-system-window-price': 'Slim system window',
  'slim-aluminium-window-price-luxury': 'Slim luxury casement',
  'top-hung-casement-window': 'Top-hung casement',
  '2-track-french-sliding-door': 'French sliding door',
  'french-door-georgian-bar': 'French Georgian bar',
  'georgian-grill-casement-door': 'Georgian grill door',
  'slim-entrance-glass-door': 'Slim entrance door',
  'slimline-aluminium-window': 'Slimline casement',
  'full-elevation-villa-facade': 'Full villa elevation',
  // Aluminium — guides
  'aluminium-window-price-per-sqft': 'Price per sqft guide',
  'aluminium-window-glass-price-breakdown': 'Glass cost breakdown',
  'best-aluminium-window-for-home': 'Best window for home',
  'sliding-vs-casement-window': 'Sliding vs casement',
  'what-is-aluminium-system-window': 'What is system window?',
  'aluminium-system-window-brands-india': 'System window brands',
  'system-window-glass-options': 'System window glass',
  'system-window-installation': 'System window install',
  'system-window-vs-normal-window': 'System vs normal window',
  'system-window-for-villa': 'System window for villa',
  '2-track-aluminium-window-price': '2-track sliding (29 mm)',
  // Aluminium — cities
  'aluminium-window-price-bangalore': 'Windows — Bengaluru',
  'aluminium-window-price-chandigarh': 'Windows — Chandigarh',
  'aluminium-window-price-delhi': 'Windows — Delhi NCR',
  'aluminium-window-price-hyderabad': 'Windows — Hyderabad',
  'aluminium-window-price-mumbai': 'Windows — Mumbai',
  'aluminium-window-price-pune': 'Windows — Pune',
  'aluminium-window-price-vijayawada': 'Windows — Vijayawada',
  'aluminium-window-price-visakhapatnam': 'Windows — Visakhapatnam',
  'aluminium-window-price-warangal': 'Windows — Warangal',
  // Telescope / folding
  'telescopic-slim-sliding-door': 'Slim telescopic door',
  'fold-bifold-aluminium-doors': 'Bi-fold balcony door',
  'fold-sliding-window-system': 'Fold & slide window',
  // Pergola
  'aluminium-pergola': 'Terrace glass-roof pergola',
  'aluminium-pergola-glass-roof-price-india': 'Glass-roof pergola guide',
  'glass-skylight': 'Glass skylight roof',
  'retractable-pergola': 'Motorized retractable roof',
  'profile-pergola': 'Profile louver pergola',
  'profile-iron-canopy': 'Iron canopy pergola',
  // Louvers
  'aluminium-louvre-75x38mm-price': '75×38 mm facade louver',
  'aluminium-louvre-100x50mm-price': '100×50 mm heavy louver',
  'aluminium-facade-louver-price': 'Facade louver',
  'motorized-louver-price-india': 'Motorized louver',
  'perforated-aluminium-panel-price': 'Perforated facade panel',
  'ventilation-louver-price-per-sqft': 'Ventilation louver panel',
  'wooden-finish-aluminium-louvers': 'Wood-look louvers',
  'ceiling-pergola-louvers': 'Ceiling rafters',
  'curved-architectural-louvers': 'Curved architectural',
  'commercial-building-louvers': 'Commercial bulk supply',
  'louver-canopy-facade': 'Entry canopy louvers',
  'louver-installation-guide': 'Installation guide',
  'aluminium-louver-design-building': 'Building louver design',
  'fixed-vs-motorized-louver': 'Fixed vs motorized',
  'louver-vs-acp-cladding': 'Louver vs ACP cladding',
  'louver-price-delhi': 'Louvers — Delhi NCR',
  'louver-price-hyderabad': 'Louvers — Hyderabad',
  'louver-price-jaipur': 'Louvers — Jaipur',
  // Mirror profiles
  'led-mirror-profile-price': 'C-type LED mirror',
  'led-mirror-profile-delhi': 'D-type LED — Delhi NCR',
  'led-mirror-profile-hyderabad': 'Mirror rates — Hyderabad',
  'mirror-profile-without-led': 'Plain frame (no LED)',
  'backlit-mirror-profile-price': 'Touch backlit rectangle',
  'motion-sensor-mirror-profile': 'Motion sensor luxury',
  'touch-sensor-mirror-profile': 'Touch sensor mirror',
  'led-bathroom-mirror-profile': 'Bathroom backlit mirror',
  'wardrobe-mirror-profile': 'Wardrobe mirror',
  'round-mirror-profile': 'Round touch LED',
  'rectangular-mirror-profile': 'Rectangular touch LED',
  'custom-mirror-profile': 'Custom height mirror',
  'mirror-profile-price-per-foot': 'Beveled glass only',
  'aluminium-mirror-frame-designs': 'Black oval motion mirror',
  // Shower — calculators
  'frameless-shower-partition': 'Frameless walk-in',
  'black-profile-shower-partition': 'Black profile sliding',
  'premium-black-profile-shower': 'Black profile openable',
  'slim-frame-shower-partition': 'Gold fluted shower',
  'frosted-glass-bathroom-door': 'Frosted fold & slide',
  // Shower — articles
  'glass-shower-partition-price': 'Glass partition guide',
  'sliding-shower-door-price': 'Sliding door guide',
  'fixed-glass-shower-panel-price': 'Fixed splash panel',
  'shower-enclosure-price': 'Full enclosure guide',
  'frameless-glass-shower-price': 'Frameless price guide',
  'bathroom-shower-design-price': 'Shower design layouts',
  'small-bathroom-shower-design': 'Small bathroom ideas',
  'corner-shower-partition-price': 'L-corner partition',
  'walk-in-shower-glass-price': 'Walk-in wet zone',
  'shower-curtain-vs-glass-partition': 'Curtain vs glass',
  'framed-vs-frameless-shower': 'Framed vs frameless',
  'shower-glass-thickness': 'Glass thickness (6–10 mm)',
  'shower-glass-types': 'Glass types & finishes',
  'shower-installation-cost': 'Installation cost',
  'shower-glass-maintenance': 'Cleaning & care',
  // Elevation / glass / railing
  'hpl-acp-elevation-cladding': 'HPL + ACP combo cladding',
  'hpl-exterior-cladding': 'HPL exterior panels',
  'balcony-glass-railing': 'Balcony glass railing',
  'staircase-glass-railing': 'Staircase glass railing',
  'glass-elevation-price-bangalore': 'Glass — Bengaluru',
  'glass-elevation-price-chandigarh': 'Glass — Chandigarh',
  'glass-elevation-price-delhi': 'Glass — Delhi NCR',
  'glass-elevation-price-mumbai': 'Glass — Mumbai',
  'glass-elevation-price-pune': 'Glass — Pune',
  'glass-elevation-price-vijayawada': 'Glass — Vijayawada',
  'glass-elevation-price-visakhapatnam': 'Glass — Visakhapatnam',
  'glass-elevation-price-warangal': 'Glass — Warangal',
  // Grills
  'aluminium-window-grills': 'Aluminium window grill',
  'balcony-safety-grills': 'Balcony safety grill',
  'iron-safety-grills': 'Iron window grill',
  'staircase-balustrade-grills': 'Staircase balustrade',
  'window-safety-grills': 'Window safety grill',
  'grills-tools-guide': 'Grill calculator guide'
};

function slugLabel(id) {
  return String(id || 'Page')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, function (c) { return c.toUpperCase(); })
    .replace(/\s+/g, ' ')
    .trim();
}

function cityFromId(id, prefix) {
  if (!id.startsWith(prefix)) return null;
  var city = id.slice(prefix.length);
  return CITY_NAMES[city] || slugLabel(city);
}

function navLabelFromTitle(title, id) {
  if (NAV_LABEL_OVERRIDES[id]) return NAV_LABEL_OVERRIDES[id];

  var city;
  if ((city = cityFromId(id, 'aluminium-window-price-'))) return 'Windows — ' + city;
  if ((city = cityFromId(id, 'glass-elevation-price-'))) return 'Glass — ' + city;
  if ((city = cityFromId(id, 'louver-price-'))) return 'Louvers — ' + city;

  var t = String(title || id || 'Page').split('|')[0].trim();
  t = t.replace(/\s*\|\s*WoodenMax.*$/i, '');
  t = t.replace(/\s*\|\s*Woodenmax.*$/i, '');
  t = t.replace(/\s*—\s*Hub\s*$/i, '');
  t = t.replace(/\s*₹[\d,.\s–—-]+(\/sqft|\/rft|\/ft|psf)?/gi, '');
  t = t.replace(/\s*₹[\d,]+K[\s–—-₹\dK]*/gi, '');
  t = t.replace(/\s*\(\d{4}\)\s*/g, ' ');
  t = t.replace(/\s+\d{4}\s*$/g, '');
  t = t.replace(/\s*Live Calculator\s*/gi, '');
  t = t.replace(/\s*Instant Quote\s*/gi, '');
  t = t.replace(/\s*Price Calculator\s*/gi, '');
  t = t.replace(/\s*\+\s*Calculator\s*/gi, '');
  t = t.replace(/\s*Calculator\s*$/gi, '');
  t = t.replace(/\s*\bFree\b\s*$/gi, '');
  t = t.replace(/\s*Price in India\s*/gi, '');
  t = t.replace(/\s*Price India\s*/gi, '');
  t = t.replace(/\s*in India\s*/gi, '');
  t = t.replace(/\s*India\s*$/gi, '');
  t = t.replace(/\s*Per Sqft\s*/gi, '');
  t = t.replace(/\s*Per Square Feet\s*/gi, '');
  t = t.replace(/\s*Per Sq Ft\s*/gi, '');
  t = t.replace(/\s*Price\s*$/gi, '');
  t = t.replace(/\s*Price\s+/gi, ' ');
  t = t.replace(/^Aluminium Window Price in\s+/i, 'Windows — ');
  t = t.replace(/^Glass Elevation Price in\s+/i, 'Glass — ');
  t = t.replace(/^Overview — /i, 'All ');
  t = t.replace(/\s+/g, ' ').trim();

  if (!t || t.length < 3) t = slugLabel(id);
  if (t.length > 42) t = NAV_LABEL_OVERRIDES[id] || slugLabel(id);
  if (t.length > 42) t = t.slice(0, 40).trim() + '…';
  return t;
}

function parseCsvLine(line) {
  var out = [];
  var cur = '';
  var q = false;
  for (var i = 0; i < line.length; i++) {
    var c = line[i];
    if (c === '"') { q = !q; continue; }
    if (c === ',' && !q) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

function pathFromLink(link) {
  try {
    return new URL(link).pathname.replace(/^\//, '').replace(/\/$/, '');
  } catch (e) {
    return String(link || '').replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '');
  }
}

function htmlPathFromHref(href) {
  var rel = href.replace(/\/$/, '');
  var direct = path.join(ROOT, rel + '.html');
  if (fs.existsSync(direct)) return direct;
  var index = path.join(ROOT, rel, 'index.html');
  if (fs.existsSync(index)) return index;
  return null;
}

function readPageMeta(htmlPath) {
  if (!htmlPath || !fs.existsSync(htmlPath)) return { title: null, navLabel: null, pageType: null };
  var c = fs.readFileSync(htmlPath, 'utf8');
  var nav = c.match(/<meta\s+name=["']nav-label["']\s+content=["']([^"']+)["']/i);
  if (nav) return { title: null, navLabel: nav[1].trim(), pageType: null };
  var title = c.match(/<title>([^<]+)<\/title>/i);
  return { title: title ? title[1].trim() : null, navLabel: null, pageType: null };
}

function pageSortKey(item) {
  if (item.kind === 'hub') return '0';
  if (item.pageType === 'live-calculator') return '1-' + item.label;
  if (item.pageType === 'price-guide') return '2-' + item.label;
  if (item.isCity) return '4-' + item.label;
  return '3-' + item.label;
}

var csv = fs.readFileSync(CSV, 'utf8');
var lines = csv.split(/\r?\n/).filter(Boolean);
var header = parseCsvLine(lines[0]);
var idx = {};
header.forEach(function (h, i) { idx[h] = i; });

var byCat = {};
HUBS.forEach(function (h) { byCat[h.slug] = new Map(); });
var cityPages = new Map();

for (var li = 1; li < lines.length; li++) {
  var cols = parseCsvLine(lines[li]);
  var id = cols[idx.id];
  var title = cols[idx.title];
  var link = cols[idx.link];
  var cat = cols[idx.custom_label_0];
  var pageType = cols[idx.custom_label_2] || '';
  if (!cat || !byCat[cat]) {
    if (link && link.indexOf('/pergola/') >= 0) cat = 'pergola';
    else continue;
  }
  var p = pathFromLink(link);
  if (!p) continue;
  var hubHref = (HUBS.find(function (h) { return h.slug === cat; }) || {}).href;
  var hubPath = hubHref.replace(/\/$/, '');
  if (p === hubPath || p === hubPath + '/index') continue;
  if (id === 'index' && p.indexOf('/') === p.lastIndexOf('/')) continue;

  var htmlPath = htmlPathFromHref(p);
  var meta = readPageMeta(htmlPath);
  var label = meta.navLabel || navLabelFromTitle(meta.title || title, id);
  var cityEntry = detectCityEntry(id, p);

  if (cityEntry) {
    cityPages.set(p, cityEntry);
    continue;
  }

  byCat[cat].set(p, {
    label: label,
    href: p,
    id: id,
    pageType: pageType,
    isCity: false
  });
}

// Merge HTML files on disk not listed in CSV (e.g. new article pages)
HUBS.forEach(function (h) {
  var dir = path.join(ROOT, 'products', h.slug);
  if (!fs.existsSync(dir)) return;
  var hubPath = h.href.replace(/\/$/, '');
  fs.readdirSync(dir).forEach(function (file) {
    if (!file.endsWith('.html')) return;
    if (file === 'index.html') return;
    var id = file.replace(/\.html$/, '');
    var p = hubPath + '/' + id;
    if (byCat[h.slug].has(p) || cityPages.has(p)) return;
    var htmlPath = path.join(dir, file);
    var meta = readPageMeta(htmlPath);
    var cityEntry = detectCityEntry(id, p);
    if (cityEntry) {
      cityPages.set(p, cityEntry);
      return;
    }
    byCat[h.slug].set(p, {
      label: meta.navLabel || navLabelFromTitle(meta.title, id),
      href: p,
      id: id,
      pageType: '',
      isCity: false
    });
  });
});

// City hub pages (city/*.html)
CITY_HUB_SLUGS.forEach(function (slug) {
  var href = 'city/' + slug;
  var htmlPath = path.join(ROOT, href + '.html');
  if (!fs.existsSync(htmlPath)) return;
  if (cityPages.has(href)) return;
  cityPages.set(href, detectCityEntry(slug, href));
});

var cities = [{ label: 'Browse all cities', href: 'catalog', kind: 'hub' }]
  .concat(Array.from(cityPages.values()).sort(function (a, b) {
    return a.sortKey.localeCompare(b.sortKey);
  }).map(function (c) {
    return { label: c.label, href: c.href, group: c.group };
  }));

// Blog posts
var blogPosts = [{ label: 'All blog posts', href: 'blog', kind: 'hub' }];
var blogDir = path.join(ROOT, 'blog');
if (fs.existsSync(blogDir)) {
  fs.readdirSync(blogDir).filter(function (f) { return f.endsWith('.html'); }).sort().forEach(function (file) {
    var id = file.replace(/\.html$/, '');
    var href = 'blog/' + id;
    var meta = readPageMeta(path.join(blogDir, file));
    var bl = BLOG_LABEL_OVERRIDES[id] || navLabelFromTitle(meta.title, id);
    blogPosts.push({ label: bl, href: href });
  });
}

var hubs = HUBS.map(function (h) {
  var items = Array.from(byCat[h.slug].values());
  items.sort(function (a, b) {
    return pageSortKey(a).localeCompare(pageSortKey(b));
  });
  return {
    slug: h.slug,
    label: h.label,
    href: h.href,
    children: [{ label: 'All ' + h.label, href: h.href.replace(/\/$/, ''), kind: 'hub' }].concat(
      items.map(function (item) {
        return { label: item.label, href: item.href };
      })
    )
  };
});

// 301 map from _redirects, so nav never links through a redirect hop.
var REDIRECTS = new Map();
(function loadRedirects() {
  var rf = path.join(ROOT, '_redirects');
  if (!fs.existsSync(rf)) return;
  fs.readFileSync(rf, 'utf8').split(/\r?\n/).forEach(function (line) {
    var t = line.trim();
    if (!t || t[0] === '#') return;
    var p = t.split(/\s+/);
    if (p.length < 3 || p[0].indexOf('*') !== -1 || /^https?:/i.test(p[0])) return;
    if (p[2] !== '301' && p[2] !== '302') return;
    if (!REDIRECTS.has(p[0])) REDIRECTS.set(p[0], p[1]);
  });
})();

function finalHref(u) {
  var cur = u;
  for (var i = 0; i < 5; i++) {
    var to = REDIRECTS.get(cur) || REDIRECTS.get(cur.replace(/\/$/, ''));
    if (!to || to === cur) break;
    cur = to;
  }
  return cur;
}

/**
 * Every href in the nav tree ships as a root-absolute URL pointing at its final
 * destination. Relative hrefs used to be resolved at runtime against the
 * current path, so the same menu item pointed somewhere different depending on
 * which URL the page was served at — the source of the duplicate crawl paths.
 */
function absolutizeTree(node) {
  if (Array.isArray(node)) return node.map(absolutizeTree);
  if (node && typeof node === 'object') {
    var out = {};
    for (var k of Object.keys(node)) {
      var v = node[k];
      if (k === 'href' && typeof v === 'string' && !/^(?:[a-z]+:|\/\/|#)/i.test(v)) {
        out[k] = finalHref('/' + v.replace(/^\/+/, ''));
      } else {
        out[k] = absolutizeTree(v);
      }
    }
    return out;
  }
  return node;
}

var tree = absolutizeTree({ hubs: hubs, cities: cities, blog: blogPosts, site: SITE_LINKS });

var outJs =
  '/* Auto-generated by tools/generate-nav-tree.cjs — do not edit by hand */\n' +
  '(function () {\n' +
  '  \'use strict\';\n' +
  '  window.WM_NAV_TREE = ' + JSON.stringify(tree, null, 2) + ';\n' +
  '})();\n';

fs.writeFileSync(OUT, outJs, 'utf8');
console.log('Wrote', OUT);
hubs.forEach(function (h) {
  console.log(' ', h.label + ':', h.children.length, 'links');
  h.children.slice(1, 6).forEach(function (c) { console.log('    ·', c.label); });
  if (h.children.length > 6) console.log('    … +' + (h.children.length - 6) + ' more');
});
console.log(' Cities:', cities.length, '| Blog:', blogPosts.length);
