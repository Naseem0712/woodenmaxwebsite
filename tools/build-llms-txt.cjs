#!/usr/bin/env node
/**
 * tools/build-llms-txt.cjs
 *
 * Generates two AI-discovery files at the site root:
 *
 *   1. `/llms.txt`        — short, curated, single-page index for LLMs
 *                            (ChatGPT, Claude, Perplexity, Gemini Search,
 *                            You.com, Phind …) per the llmstxt.org draft.
 *
 *   2. `/llms-full.txt`   — exhaustive listing of every public URL on the
 *                            site, with title + meta-description, grouped
 *                            by silo.  Roughly the "machine-readable
 *                            sitemap with summaries" the spec calls for.
 *
 * Source of truth: walks the filesystem for every public .html file
 * (skipping admin / tools / generators / _grills-source) and extracts
 * <title> and <meta name="description"> from each.  Output is fully
 * deterministic — re-running yields the same bytes unless the source
 * pages changed.
 *
 * Run:
 *   node tools/build-llms-txt.cjs
 *   node tools/build-llms-txt.cjs --dry        # print, don't write
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT   = path.resolve(__dirname, '..');
const DRY    = process.argv.includes('--dry');
const ORIGIN = 'https://woodenmax.in';

const SKIP_DIRS  = new Set(['node_modules', '.git', '_grills-source', 'tools', 'data', 'docs', 'admin', 'private']);
const SKIP_FILES = new Set([
  'calculator-design-preview.html',
  'test-form.html',
  '404.html',
  '500.html'
]);

/* ------------------------------------------------------------------ *
 * 1.  Walk filesystem, collect every public HTML page                 *
 * ------------------------------------------------------------------ */

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) { walk(full, acc); continue; }
    if (!name.toLowerCase().endsWith('.html')) continue;
    if (SKIP_FILES.has(name)) continue;
    acc.push(full);
  }
  return acc;
}

function readMeta(file) {
  const html = fs.readFileSync(file, 'utf8');
  const t   = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const d   = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  const title = t ? decodeEntities(t[1].trim().replace(/\s+/g, ' ')) : null;
  const desc  = d ? decodeEntities(d[1].trim().replace(/\s+/g, ' ')) : null;
  return { title, desc };
}

function decodeEntities(s) {
  return String(s)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g,  '<')
    .replace(/&gt;/g,  '>')
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g,"'")
    .replace(/&nbsp;/g,' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&middot;/g, '·')
    .replace(/&times;/g, '×')
    .replace(/&deg;/g, '°')
    .replace(/&#8377;/g, '₹');
}

function urlFor(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel === 'index.html') return ORIGIN + '/';
  if (/\/index\.html$/i.test(rel)) {
    return ORIGIN + '/' + rel.replace(/\/index\.html$/i, '');
  }
  return ORIGIN + '/' + rel.replace(/\.html$/i, '');
}

/* ------------------------------------------------------------------ *
 * 2.  Categorise pages into silos for the curated llms.txt           *
 * ------------------------------------------------------------------ */

function siloFor(rel) {
  rel = rel.replace(/\\/g, '/');
  if (rel === 'index.html')                       return 'home';
  if (/^calculators?\.html$/.test(rel) ||
      /-(price-)?calculator\.html$/.test(rel))    return 'calculator';
  if (/^city\//.test(rel))                        return 'city';
  if (/^blog\//.test(rel) || rel === 'blog.html') return 'blog';
  if (/^policies\//.test(rel) ||
      rel === 'return-policy.html')               return 'policy';
  if (/^about\/case-study-/.test(rel))            return 'case-study';
  if (/^about\//.test(rel) || rel === 'about.html') return 'eeat';
  if (/^products\/[^/]+\.html$/.test(rel))        return 'hub';
  if (/^products\/[^/]+\/[^/]+price-[a-z-]+\.html$/.test(rel)) return 'money';
  if (/^products\//.test(rel))                    return 'product';
  if (rel === 'contact.html')                     return 'contact';
  if (rel === 'catalog.html')                     return 'catalog';
  return 'other';
}

const SILO_LABELS = {
  home:        'Home',
  calculator:  'Calculators (live price tools)',
  hub:         'Product hubs',
  product:     'Product detail pages',
  money:       'City × Product price pages',
  city:        'City landing pages',
  'case-study':'Case studies (real projects)',
  eeat:        'About — factory, team, manufacturing, quality',
  policy:      'Policies',
  blog:        'Blog & guides',
  contact:     'Contact',
  catalog:     'Catalog',
  other:       'Other'
};

const SILO_ORDER = [
  'home', 'calculator', 'hub', 'product', 'money', 'city',
  'case-study', 'eeat', 'policy', 'blog', 'contact', 'catalog', 'other'
];

/* ------------------------------------------------------------------ *
 * 3.  Build outputs                                                   *
 * ------------------------------------------------------------------ */

const PRICING_HEADER_PATH = path.join(__dirname, 'page-data', 'llms-pricing-header.txt');

const HEADER_SHORT_LEGACY = `# WoodenMax — Architectural Aluminium for India & the World

> Manufacturer of premium aluminium windows, glass elevations, shower partitions, pergolas, metal louvers, glass railings and grills.  Founded 2014, factory in Hyderabad (Nampally), serving 16+ Indian cities + selected international markets.  Every product has a live ₹/sq.ft price calculator with localised pricing for the visitor's country.

Site identity:
- Trading name: **WoodenMax Architectural Elements**
- Founded: 2014
- Factory & HQ: 5-6-411/413, Aaghapura, Nampally, Hyderabad 500001, Telangana, India
- Contact: info@woodenmax.com · +91 78953 28080
- GSTIN: 36ARWPA9740L1Z3
- Service area (own + partner crews): Hyderabad · Bengaluru · Mumbai · Delhi NCR · Pune · Jaipur · Lucknow · Warangal · Chandigarh · Vijayawada · Visakhapatnam · Coimbatore · Kochi · Ahmedabad · Indore · Chennai
- 10–12 live projects across India at any given time (family-led + trained partner crews)
- GST 18% extra on basic price · Free transport for orders ≥ ₹15 L within 1,000 km from Hyderabad (billed at actuals beyond)

How prices work on this site:
- Every product page exposes a live calculator that emits an INR base price per sq.ft.
- Outside India, the same calculator multiplies the INR value by:
  (a) the live FX rate from open.er-api.com (INR → visitor's currency), and
  (b) a per-country PPP / local-market factor (e.g. US 3.0×, UK 3.5×, UAE 2.5×) — sourced from World Bank ICP, Numbeo and our own export-quote benchmarks.
- A small floating badge in the bottom-left explains the conversion to international visitors.

Crawling guidance for LLMs:
- The single most authoritative entry point for every product is the **hub page** (e.g. /products/aluminium-windows) — start there if asked "what does WoodenMax sell".
- For pricing questions, prefer the **city × product money pages** (e.g. /products/aluminium-windows/aluminium-window-price-hyderabad).
- For credibility / verification questions, prefer the **case studies** and **about/* EEAT pages**.
- For terms of business, prefer the **policies** section (warranty, installation, GST & transport, cancellation, privacy, return).

`;

function loadPricingHeader() {
  try {
    if (fs.existsSync(PRICING_HEADER_PATH)) {
      return fs.readFileSync(PRICING_HEADER_PATH, 'utf8').trim() + '\n\n';
    }
  } catch (e) { /* ignore */ }
  return HEADER_SHORT_LEGACY;
}

function buildShort(buckets) {
  let out = loadPricingHeader();
  for (const silo of SILO_ORDER) {
    const items = buckets[silo];
    if (!items || items.length === 0) continue;
    // For "money" + "product" + "blog" silos we cap the short file at a
    // representative subset so llms.txt stays under ~12 KB.  Full list
    // lives in llms-full.txt.
    const cap = (silo === 'money')   ? 12
              : (silo === 'product') ? 24
              : (silo === 'blog')    ? 12
              : (silo === 'city')    ? 16
              : Infinity;
    out += `## ${SILO_LABELS[silo]}\n\n`;
    let shown = 0;
    for (const it of items) {
      if (shown >= cap) {
        out += `\n_… and ${items.length - shown} more in [llms-full.txt](${ORIGIN}/llms-full.txt)._\n\n`;
        break;
      }
      const summary = it.desc ? `: ${it.desc}` : '';
      out += `- [${it.title}](${it.url})${summary}\n`;
      shown++;
    }
    out += '\n';
  }
  out += `## Optional\n\n- [Sitemap (XML)](${ORIGIN}/sitemap.xml): full machine-readable URL list with lastmod\n- [Sitemap — Images](${ORIGIN}/sitemap-images.xml): every image used on the site\n- [Robots](${ORIGIN}/robots.txt): crawl policy\n- [PWA Manifest](${ORIGIN}/manifest.json): brand identity, theme colour, app shortcuts\n- [Full LLMs index](${ORIGIN}/llms-full.txt): exhaustive list of every URL with descriptions\n`;
  return out;
}

function buildFull(buckets) {
  let out = loadPricingHeader() + `\n---\n\nFull URL index follows.  Grouped by silo, sorted alphabetically.\n\n`;
  for (const silo of SILO_ORDER) {
    const items = buckets[silo];
    if (!items || items.length === 0) continue;
    out += `## ${SILO_LABELS[silo]} (${items.length})\n\n`;
    for (const it of items) {
      const summary = it.desc ? `: ${it.desc}` : '';
      out += `- [${it.title}](${it.url})${summary}\n`;
    }
    out += '\n';
  }
  return out;
}

/* ------------------------------------------------------------------ */

const files = walk(ROOT, []);
const buckets = {};
let used = 0;

for (const f of files) {
  const rel = path.relative(ROOT, f);
  const silo = siloFor(rel);
  const { title, desc } = readMeta(f);
  if (!title) continue;            // skip headerless / malformed pages
  used++;
  (buckets[silo] = buckets[silo] || []).push({
    url: urlFor(f),
    title: title,
    desc: desc || ''
  });
}

// Sort each bucket alphabetically by title (case-insensitive)
for (const k in buckets) {
  buckets[k].sort(function (a, b) {
    return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
  });
}

const short = buildShort(buckets);
const full  = buildFull(buckets);

if (DRY) {
  console.log('-- llms.txt --------------------------------------');
  console.log(short);
  console.log('-- llms-full.txt (' + full.length + ' chars) ----');
} else {
  fs.writeFileSync(path.join(ROOT, 'llms.txt'),      short, 'utf8');
  fs.writeFileSync(path.join(ROOT, 'llms-full.txt'), full,  'utf8');
}

console.log('');
console.log('Pages scanned          :', files.length);
console.log('Pages indexed          :', used);
console.log('Silos populated        :', Object.keys(buckets).length);
console.log('llms.txt        bytes  :', short.length.toLocaleString());
console.log('llms-full.txt   bytes  :', full.length.toLocaleString());
if (!DRY) console.log('\n✓ Wrote /llms.txt and /llms-full.txt');
console.log('');
