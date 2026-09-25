/**
 * Verify City Differentiation Pilot A (BLR + Mumbai AW pages).
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const ORIGIN = process.env.VERIFY_ORIGIN || 'https://woodenmax.in';

const PAGES = [
  {
    key: 'bangalore',
    file: 'products/aluminium-windows/aluminium-window-price-bangalore.html',
    path: '/products/aluminium-windows/aluminium-window-price-bangalore',
    mustHave: [
      'apartment', 'villa', 'Whitefield', 'Sarjapur', 'ORR', '3-track', 'casement', 'acoustic',
      'aluminium-window-price-calculator', 'aluminium-window-price-per-sqft',
      '3-track-sliding-window', 'city/bangalore', 'glass-elevation-price-bangalore',
      '₹550', '₹2250', '₹1150', '2,48,400', '2,93,112'
    ],
    mustNot: [
      '62%', 'last 200', 'multiple completed projects', 'repeat referrals', 'operations hub',
      'Seaside', 'cyclone', 'Class-2 Seaside', 'Class-9A',
      'hoist', 'Western Railway', 'sea-facing', 'salt-spray',
      'eats a budget-tier powder coat'
    ],
    forbiddenFaqOverlapHints: [] // filled after load
  },
  {
    key: 'mumbai',
    file: 'products/aluminium-windows/aluminium-window-price-mumbai.html',
    path: '/products/aluminium-windows/aluminium-window-price-mumbai',
    mustHave: [
      'coastal', 'Seaside', 'monsoon', 'high-rise', 'water-tight', 'acoustic', 'hoist',
      'aluminium-window-price-calculator', 'aluminium-window-price-per-sqft',
      'city/mumbai', 'glass-elevation-price-mumbai', 'warranty-policy', 'gst-transport-policy',
      '₹550', '₹2250', '₹1150', '2,48,400', '2,93,112'
    ],
    mustNot: [
      '62%', 'last 200', 'multiple completed projects', 'repeat referrals', 'operations hub',
      'Whitefield', 'Sarjapur', 'ORR', 'villa deck', 'apartment vs villa', '3-track sliding'
    ]
  }
];

const PRICE_ANCHORS = ['₹550', '₹2250', '₹1150', '2,48,400', '44,712', '2,93,112', '248,000'];

function extractFaqs (html) {
  const faqs = [];
  const re = /<details><summary>([\s\S]*?)<\/summary>/g;
  let m;
  while ((m = re.exec(html))) faqs.push(m[1].replace(/&#39;/g, "'").replace(/&amp;/g, '&'));
  return faqs;
}

function extractLinks (html) {
  const set = new Set();
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    let href = m[1].replace(/&amp;/g, '&');
    if (href.startsWith('http') && !href.includes('woodenmax.in')) continue;
    if (href.startsWith('#')) continue;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    set.add(href);
  }
  return [...set];
}

function fetchStatus (url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'HEAD', timeout: 15000 }, (res) => {
      resolve(res.statusCode);
      res.resume();
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
    req.end();
  });
}

async function main () {
  const report = { ok: true, pages: [] };
  const faqSets = {};

  for (const p of PAGES) {
    const html = fs.readFileSync(path.join(ROOT, p.file), 'utf8');
    const issues = [];

    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || '';
    if (canonical !== 'https://woodenmax.in' + p.path) {
      issues.push('canonical mismatch: ' + canonical);
    }

    const h1 = (html.match(/<h1>([^<]+)<\/h1>/) || [])[1] || '';
    if (!/Aluminium Window price in (Bengaluru|Mumbai) \(2026\) — ₹550–₹2250\/sqft/.test(h1)) {
      issues.push('H1 identity changed: ' + h1);
    }

    for (const a of PRICE_ANCHORS) {
      if (!html.includes(a) && !(a === '248,000' && html.includes('₹248,000'))) {
        // 248,000 appears as ₹248,000 in body
        if (a === '248,000' && /₹248,000|248,000/.test(html)) continue;
        issues.push('missing price anchor: ' + a);
      }
    }

    for (const s of p.mustHave) {
      if (!html.toLowerCase().includes(s.toLowerCase()) && !html.includes(s)) {
        issues.push('missing expected: ' + s);
      }
    }
    for (const s of p.mustNot) {
      if (html.includes(s)) issues.push('forbidden content present: ' + s);
    }

    faqSets[p.key] = extractFaqs(html);
    const links = extractLinks(html).filter((h) =>
      h.includes('aluminium-window-price-calculator') ||
      h.includes('aluminium-window-price-per-sqft') ||
      h.includes('3-track') ||
      h.includes('casement') ||
      h.includes('soundproof') ||
      h.includes('/city/') ||
      h.includes('glass-elevation-price') ||
      h.includes('warranty') ||
      h.includes('gst-transport') ||
      h.includes('installation-policy')
    );

    report.pages.push({
      key: p.key,
      issues,
      faqCount: faqSets[p.key].length,
      faqs: faqSets[p.key],
      checkLinks: links,
      h1,
      canonical
    });
    if (issues.length) report.ok = false;
  }

  // FAQ overlap
  const blr = new Set(faqSets.bangalore.map((q) => q.toLowerCase()));
  const mum = faqSets.mumbai.map((q) => q.toLowerCase());
  const overlap = mum.filter((q) => blr.has(q));
  if (overlap.length) {
    report.ok = false;
    report.faqOverlap = overlap;
  } else {
    report.faqOverlap = [];
  }

  // Link checks (live)
  const allLinks = new Set();
  for (const page of report.pages) {
    for (const l of page.checkLinks) allLinks.add(l);
  }
  // always verify calculator + self
  allLinks.add('/aluminium-window-price-calculator');
  allLinks.add('/products/aluminium-windows/aluminium-window-price-bangalore');
  allLinks.add('/products/aluminium-windows/aluminium-window-price-mumbai');

  report.linkStatuses = {};
  for (const href of [...allLinks]) {
    let url = href;
    if (url.startsWith('/')) url = ORIGIN + url.split('?')[0];
    else if (url.startsWith('https://woodenmax.in')) url = url.split('?')[0];
    else continue;
    const status = await fetchStatus(url);
    report.linkStatuses[url] = status;
    if (status !== 200) {
      // try GET if HEAD blocked
      const getStatus = await new Promise((resolve) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.request(url, { method: 'GET', timeout: 20000 }, (res) => {
          resolve(res.statusCode);
          res.resume();
        });
        req.on('error', () => resolve(0));
        req.on('timeout', () => { req.destroy(); resolve(0); });
        req.end();
      });
      report.linkStatuses[url] = getStatus;
      if (getStatus !== 200) report.ok = false;
    }
  }

  // Material differentiation: shared boilerplate ratio on body text
  const blrHtml = fs.readFileSync(path.join(ROOT, PAGES[0].file), 'utf8');
  const mumHtml = fs.readFileSync(path.join(ROOT, PAGES[1].file), 'utf8');
  const blrBody = (blrHtml.match(/<header class="cluster-hero">[\s\S]*<section class="cluster-final-cta">/) || [''])[0];
  const mumBody = (mumHtml.match(/<header class="cluster-hero">[\s\S]*<section class="cluster-final-cta">/) || [''])[0];
  const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const a = strip(blrBody);
  const b = strip(mumBody);
  // Jaccard on word set
  const wa = new Set(a.toLowerCase().split(' ').filter(Boolean));
  const wb = new Set(b.toLowerCase().split(' ').filter(Boolean));
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  const union = wa.size + wb.size - inter;
  const jaccard = union ? inter / union : 1;
  report.textJaccard = Number(jaccard.toFixed(3));
  report.differentiationOk = jaccard < 0.72; // expect material difference
  if (!report.differentiationOk) report.ok = false;

  fs.writeFileSync(path.join(ROOT, 'tools/_verify-aw-city-pilot-a-out.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log(report.ok ? 'VERIFY_PASS' : 'VERIFY_FAIL');
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
