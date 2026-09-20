#!/usr/bin/env node
'use strict';
/**
 * Wave 2 Batch A gates: aluminium-sliding-window + folding-systems
 * Preserve title/meta/H1; calc still updates; viewports; no console errors.
 */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.INFO_REFRESH_PORT || 3462);
const base = `http://127.0.0.1:${port}`;

const pages = [
  {
    slug: 'aluminium-sliding-window',
    rel: '/products/aluminium-windows/aluminium-sliding-window.html',
    title: '29mm Premium 2-Track Aluminium Sliding Window ₹1,200–1,400/sqft (2026) | WoodenMax',
    h1: 'Aluminium Sliding Window ( 2 Track Window )',
    metaIncludes: '29mm premium 2-track aluminium sliding window ₹1,200–1,400/sqft',
    mustHave: [
      'Stay on this page or go elsewhere?',
      '29mm 2-track',
      'optional add-on',
      'not a third track',
      'Bedroom 5×4 ft',
      'Living / balcony 6×4 ft',
      'domal-window-price',
      '3-track-sliding-window',
    ],
    mustNot: [],
    calcSelector: '#price-calculator-29mm-sliding',
    dataProduct: '29mm-sliding',
    priceBand: ['₹1200', '₹1400'],
  },
  {
    slug: 'folding-systems',
    rel: '/products/folding-systems.html',
    title: 'Bi-Fold vs Fold & Slide — Compare Prices ₹1,550–2,850/sqft (2026) | WoodenMax',
    h1: 'Folding Door Price: Bi-Fold vs Fold & Slide Comparison',
    metaIncludes: 'Compare Bi-Fold (₹1,750–2,850/sqft) vs Fold & Slide (₹1,550–2,150/sqft)',
    mustHave: [
      'Choose by use-case first',
      '10–12 ft balcony',
      '6–8 ft entrance',
      'Install / process',
      'fold-bifold-aluminium-doors#price-calculator',
      'fold-sliding-window-system#price-calculator',
    ],
    mustNot: [
      'Folding Door Systems Collection | Bi-Fold Doors, Fold & Slide Systems, Balcony Doors',
      'Why Folding Doors Beat Sliding Doors | 95% Opening vs 50% Opening | Bi-Fold vs Sliding Doors',
    ],
    calcSelector: null,
    dataProduct: null,
    priceBand: ['₹1750-2850', '₹1550-2150'],
  },
];

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.webp')) return 'image/webp';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.join(root, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const outDir = path.join(root, 'tools', 'info-refresh-wave2-batch-a-screenshots');
  fs.mkdirSync(outDir, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const report = { ok: true, pages: [] };

  try {
    for (const p of pages) {
      const pageReport = { slug: p.slug, viewports: [], consoleErrors: [], pageErrors: [], failedRequests: [], checks: {} };
      const page = await browser.newPage();
      page.on('console', (msg) => { if (msg.type() === 'error') pageReport.consoleErrors.push(msg.text()); });
      page.on('pageerror', (err) => pageReport.pageErrors.push(err.message));
      page.on('response', (res) => {
        if (res.status() >= 400) pageReport.failedRequests.push({ url: res.url(), status: res.status() });
      });

      await page.goto(base + p.rel, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1500);

      const identity = await page.evaluate(() => ({
        title: document.title,
        h1: (document.querySelector('h1') || {}).textContent || '',
        meta: (document.querySelector('meta[name="description"]') || {}).content || '',
        body: document.body.innerText,
        html: document.documentElement.outerHTML,
        dataProduct: (document.querySelector('[data-product]') || {}).getAttribute?.('data-product') || null,
      }));

      pageReport.checks.titleOk = identity.title === p.title;
      pageReport.checks.h1Ok = identity.h1.replace(/\s+/g, ' ').trim() === p.h1;
      pageReport.checks.metaOk = identity.meta.includes(p.metaIncludes);
      pageReport.checks.mustHave = p.mustHave.map((s) => ({
        s,
        ok: identity.body.includes(s) || identity.html.includes(s),
      }));
      pageReport.checks.mustNot = p.mustNot.map((s) => ({ s, ok: !identity.html.includes(s) }));
      pageReport.checks.priceBand = p.priceBand.map((s) => ({ s, ok: identity.body.includes(s) || identity.html.includes(s) }));
      if (p.dataProduct) {
        pageReport.checks.dataProductOk = identity.dataProduct === p.dataProduct;
      }

      let calcProbe = { possible: false, skipped: !p.calcSelector };
      if (p.calcSelector) {
        calcProbe = await page.evaluate(async (sel) => {
          const rootEl = document.querySelector(sel);
          if (!rootEl) return { possible: false, reason: 'no calc root' };
          const input = rootEl.querySelector('input[type="number"], input[type="text"], #calc-width, .calc-size-row input');
          const total =
            rootEl.querySelector('[id*="total"], [id*="result"], .calc-total, .calc-price-value') ||
            document.querySelector('#calc-total, #calc-result-total, .calc-grand-total');
          if (!input) return { possible: false, reason: 'no input' };
          const before = total ? total.textContent.trim() : '';
          const prev = Number(input.value || 0);
          input.value = String(prev > 0 ? prev + 1 : 6);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise((r) => setTimeout(r, 900));
          const after = total ? total.textContent.trim() : '';
          const updated = !total || (before !== after && after !== '₹0' && after !== '');
          return { possible: true, updated: !!updated || !!rootEl.querySelector('.calc-price-display, .calc-results'), before, after };
        }, p.calcSelector);
      }
      pageReport.checks.calcUpdated = calcProbe;

      for (const w of [390, 768, 1366, 1440]) {
        await page.setViewportSize({ width: w, height: w < 800 ? 844 : 900 });
        await page.waitForTimeout(350);
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const sw = Math.max(doc.scrollWidth, body.scrollWidth);
          const cw = doc.clientWidth;
          return { sw, cw, overflow: sw > cw + 2 };
        });
        const shot = path.join(outDir, `${p.slug}-${w}.png`);
        await page.screenshot({ path: shot, fullPage: false });
        pageReport.viewports.push({ w, ...overflow, shot });
        if (overflow.overflow) pageReport.ok = false;
      }

      const failIdentity = !pageReport.checks.titleOk || !pageReport.checks.h1Ok || !pageReport.checks.metaOk;
      const failMust =
        pageReport.checks.mustHave.some((x) => !x.ok) ||
        pageReport.checks.mustNot.some((x) => !x.ok) ||
        pageReport.checks.priceBand.some((x) => !x.ok);
      const failCalc = p.calcSelector && (!calcProbe.possible || !calcProbe.updated);
      const failData = p.dataProduct && !pageReport.checks.dataProductOk;
      pageReport.failedRequests = pageReport.failedRequests.filter((r) => r.url.includes('127.0.0.1'));
      const local404 = pageReport.failedRequests.filter(
        (r) => r.status >= 400 && !/favicon\.ico$/i.test(r.url)
      );
      const failConsole =
        pageReport.pageErrors.length > 0 ||
        pageReport.consoleErrors.some((e) => !/Failed to load resource/i.test(e));
      const failLocal404 = local404.length > 0;
      const failVp = pageReport.viewports.some((v) => v.overflow);
      pageReport.ok = !(failIdentity || failMust || failCalc || failData || failConsole || failLocal404 || failVp);
      if (!pageReport.ok) report.ok = false;
      report.pages.push(pageReport);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const outFile = path.join(root, 'tools', '_verify-info-refresh-wave2-batch-a-out.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
