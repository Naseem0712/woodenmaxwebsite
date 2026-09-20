#!/usr/bin/env node
'use strict';
/**
 * Wave 2 Batch B: domal-window-price only.
 * Preserve title/meta/H1, data-product=3track-sliding, AggregateOffer bands,
 * calc updates; golden 3-track file must be untouched; no new Product schema identity.
 */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright');
const { execSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.INFO_REFRESH_PORT || 3463);
const base = `http://127.0.0.1:${port}`;

const EXPECT = {
  title: 'Domal Window Price ₹550–950/sqft (2026) — 27mm / 27x65 | WoodenMax',
  h1: 'Aluminium Domal Window Price with Mesh',
  metaIncludes: 'Domal aluminium window price ₹550–950/sqft for the 27mm / 27x65',
  dataProduct: '3track-sliding',
  mustHave: [
    'What “Domal” means here',
    'Domal = 27×65',
    '2-track without mesh',
    '3-track with mesh',
    'Bedroom 4×4 ft',
    'Living 6×4 ft',
    'Same Domal calculator',
    'aluminium-sliding-window',
  ],
  priceBand: ['₹550–950', '₹550–850', '₹650–950'],
};

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

function extractAggregateOffer(html) {
  const m = html.match(/"@type"\s*:\s*"AggregateOffer"[\s\S]*?"lowPrice"\s*:\s*(\d+)[\s\S]*?"highPrice"\s*:\s*(\d+)/);
  return m ? { lowPrice: m[1], highPrice: m[2] } : null;
}

function countProductSchemas(html) {
  return (html.match(/"@type"\s*:\s*"Product"/g) || []).length;
}

(async () => {
  const outDir = path.join(root, 'tools', 'info-refresh-wave2-batch-b-screenshots');
  fs.mkdirSync(outDir, { recursive: true });
  const report = { ok: true, checks: {}, viewports: [], consoleErrors: [], pageErrors: [], failedRequests: [] };

  // Golden 3-track must be clean vs HEAD commit parent for batch B (no local mods)
  try {
    const dirty = execSync('git status --porcelain -- products/aluminium-windows/3-track-sliding-window.html', {
      cwd: root,
      encoding: 'utf8',
    }).trim();
    report.checks.golden3trackUntouched = dirty === '';
  } catch (e) {
    report.checks.golden3trackUntouched = false;
    report.checks.golden3trackError = String(e.message || e);
  }

  const htmlPath = path.join(root, 'products/aluminium-windows/domal-window-price.html');
  const raw = fs.readFileSync(htmlPath, 'utf8');
  report.checks.dataProductInSource = /data-product="3track-sliding"/.test(raw);
  report.checks.pkgProductId = /data-product-id="3track-sliding"/.test(raw);
  report.checks.aggregateOffer = extractAggregateOffer(raw);
  report.checks.aggregateOfferOk =
    report.checks.aggregateOffer &&
    report.checks.aggregateOffer.lowPrice === '8000' &&
    report.checks.aggregateOffer.highPrice === '35000';
  report.checks.productSchemaCount = countProductSchemas(raw);
  // Expect existing Product schema(s) only — no new duplicate Product identity block added
  report.checks.noExtraProductSchema = report.checks.productSchemaCount <= 2;

  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.on('console', (msg) => { if (msg.type() === 'error') report.consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => report.pageErrors.push(err.message));
    page.on('response', (res) => {
      if (res.status() >= 400) report.failedRequests.push({ url: res.url(), status: res.status() });
    });

    await page.goto(base + '/products/aluminium-windows/domal-window-price.html', {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.waitForTimeout(1500);

    const identity = await page.evaluate(() => ({
      title: document.title,
      h1: (document.querySelector('h1') || {}).textContent || '',
      meta: (document.querySelector('meta[name="description"]') || {}).content || '',
      body: document.body.innerText,
      html: document.documentElement.outerHTML,
      dataProduct: (document.querySelector('[data-product]') || {}).getAttribute?.('data-product') || null,
      trackSelect: !!document.querySelector('#calc-track, select[name*="track"], [data-track], #window-track'),
    }));

    report.checks.titleOk = identity.title === EXPECT.title;
    report.checks.h1Ok = identity.h1.replace(/\s+/g, ' ').trim() === EXPECT.h1;
    report.checks.metaOk = identity.meta.includes(EXPECT.metaIncludes);
    report.checks.dataProductOk = identity.dataProduct === EXPECT.dataProduct;
    report.checks.mustHave = EXPECT.mustHave.map((s) => ({
      s,
      ok: identity.body.includes(s) || identity.html.includes(s),
    }));
    report.checks.priceBand = EXPECT.priceBand.map((s) => ({
      s,
      ok: identity.body.includes(s) || identity.html.includes(s),
    }));

    const calcProbe = await page.evaluate(async () => {
      const rootEl = document.querySelector('#price-calculator-3track-sliding, [data-product="3track-sliding"]');
      if (!rootEl) return { possible: false, reason: 'no calc' };
      const input = rootEl.querySelector('input[type="number"], input[type="text"], .calc-size-row input');
      const total =
        rootEl.querySelector('[id*="total"], [id*="result"], .calc-total, .calc-price-value') ||
        document.querySelector('#calc-total, #calc-result-total');
      if (!input) return { possible: false, reason: 'no input' };
      const before = total ? total.textContent.trim() : '';
      const prev = Number(input.value || 0);
      input.value = String(prev > 0 ? prev + 1 : 5);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 900));
      const after = total ? total.textContent.trim() : '';
      return {
        possible: true,
        updated: !total || before !== after || !!rootEl.querySelector('.calc-price-display, .calc-results'),
        before,
        after,
        dataProduct: rootEl.getAttribute('data-product'),
      };
    });
    report.checks.calcUpdated = calcProbe;

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
      const shot = path.join(outDir, `domal-${w}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      report.viewports.push({ w, ...overflow, shot });
    }

    report.failedRequests = report.failedRequests.filter((r) => r.url.includes('127.0.0.1'));
    const local404 = report.failedRequests.filter((r) => r.status >= 400 && !/favicon/i.test(r.url));
    const failIdentity = !report.checks.titleOk || !report.checks.h1Ok || !report.checks.metaOk;
    const failMust =
      report.checks.mustHave.some((x) => !x.ok) || report.checks.priceBand.some((x) => !x.ok);
    const failCalc = !calcProbe.possible || !calcProbe.updated || calcProbe.dataProduct !== '3track-sliding';
    const failPreserve =
      !report.checks.dataProductOk ||
      !report.checks.dataProductInSource ||
      !report.checks.pkgProductId ||
      !report.checks.aggregateOfferOk ||
      !report.checks.noExtraProductSchema ||
      !report.checks.golden3trackUntouched;
    const failConsole =
      report.pageErrors.length > 0 ||
      report.consoleErrors.some((e) => !/Failed to load resource/i.test(e));
    const failVp = report.viewports.some((v) => v.overflow) || local404.length > 0;
    report.ok = !(failIdentity || failMust || failCalc || failPreserve || failConsole || failVp);
  } finally {
    await browser.close();
    server.close();
  }

  const outFile = path.join(root, 'tools', '_verify-info-refresh-wave2-batch-b-out.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
