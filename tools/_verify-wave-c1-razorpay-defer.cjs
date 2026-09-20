'use strict';
/**
 * Wave C1 verify — cold load must not fetch razorpay-checkout.js;
 * payment intent (Buy/Book/pkg-buy / open-estimate preload) loads it once.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8765;
const BASE = 'http://127.0.0.1:' + PORT;

const PAGES = [
  { id: '3-track', path: '/products/aluminium-windows/3-track-sliding-window.html' },
  { id: 'frameless-shower', path: '/products/shower-partitions/frameless-shower-partition.html' },
  { id: 'aluminium-pergola', path: '/products/pergola/aluminium-pergola.html' },
  { id: 'window-grills', path: '/products/grills/aluminium-window-grills.html' },
  { id: 'fold-bifold', path: '/products/folding-systems/fold-bifold-aluminium-doors.html' },
  { id: 'slim-entrance', path: '/products/aluminium-windows/slim-entrance-glass-door.html' }
];

function contentType (p) {
  if (p.endsWith('.html')) return 'text/html; charset=utf-8';
  if (p.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (p.endsWith('.css')) return 'text/css; charset=utf-8';
  if (p.endsWith('.json')) return 'application/json';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  if (p.endsWith('.svg')) return 'image/svg+xml';
  if (p.endsWith('.woff2')) return 'font/woff2';
  return 'application/octet-stream';
}

function startServer () {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.join(ROOT, urlPath.replace(/^\//, ''));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType(filePath), 'Cache-Control': 'no-store' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

function isRzpCheckout (u) {
  return /\/js\/razorpay-checkout\.js/i.test(u || '');
}

async function waitForModule (page, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await page.evaluate(() =>
      Boolean(window.WoodenMaxRazorpay &&
        typeof window.WoodenMaxRazorpay.startCheckout === 'function' &&
        window.WoodenMaxRazorpay.SCRIPT_VERSION === '20260729e')
    );
    if (ok) return true;
    await page.waitForTimeout(100);
  }
  return false;
}

async function runPage (browser, pageSpec) {
  const page = await browser.newPage();
  const rzp = [];
  const consoleErrors = [];
  let phase = 'cold';

  page.on('request', (r) => {
    if (isRzpCheckout(r.url())) rzp.push({ url: r.url(), phase });
  });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.route('**/checkout.razorpay.com/**', (route) => route.abort());
  await page.route('**/api/quote**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false,"blocked":true}' })
  );
  await page.route('**/api/order**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false,"blocked":true}' })
  );

  await page.goto(BASE + pageSpec.path + '?cb=' + Date.now(), {
    waitUntil: 'networkidle',
    timeout: 90000
  });
  await page.waitForTimeout(2500);

  const cold = {
    rzpCount: rzp.filter((x) => x.phase === 'cold').length,
    hasTag: await page.evaluate(() => Boolean(document.querySelector('script[src*="razorpay-checkout.js"]'))),
    hasModule: await page.evaluate(() => Boolean(window.WoodenMaxRazorpay)),
    hasUx: await page.evaluate(() =>
      Boolean(document.querySelector('script[src*="calculator-mobile-ux.js"]') || window.WoodenMaxQuote)
    )
  };

  // Non-payment: add to cart only (do not open estimate — that preloads Razorpay)
  phase = 'nonpay';
  const nonpay = await page.evaluate(() => {
    const add =
      document.querySelector('[data-action="add-to-cart"]') ||
      document.querySelector('[data-action="add-to-cart-sticky"]');
    if (add) {
      add.hidden = false;
      add.removeAttribute('hidden');
      add.click();
    }
    return {
      clickedAdd: Boolean(add),
      storeLen: window.WoodenMaxQuoteStore && window.WoodenMaxQuoteStore.list
        ? window.WoodenMaxQuoteStore.list().length
        : null
    };
  });
  await page.waitForTimeout(500);
  const nonpayRzp = rzp.filter((x) => x.phase === 'nonpay').length;

  // Intent A: open-estimate → ensureRazorpayModule (existing UX preload on sheet open)
  phase = 'intent';
  let intentPath = await page.evaluate(() => {
    const pkgBuy = document.querySelector('[data-action="pkg-buy"]');
    if (pkgBuy) {
      pkgBuy.scrollIntoView({ block: 'center' });
      pkgBuy.click();
      return 'pkg-buy';
    }
    const buy = document.querySelector('[data-action="buy-booking"]');
    if (buy) {
      buy.hidden = false;
      buy.removeAttribute('hidden');
      buy.click();
      return 'buy-booking';
    }
    const openEst = document.querySelector('[data-action="open-estimate"]');
    if (openEst) {
      openEst.click();
      return 'open-estimate';
    }
    if (window.WoodenMaxQuote && window.WoodenMaxQuote.openBookOrder) {
      window.WoodenMaxQuote.openBookOrder('booking');
      return 'openBookOrder';
    }
    return 'none';
  });
  await page.waitForTimeout(600);

  // If book form opened (pkg-buy / buy / openBookOrder), fill + submit to hit ensureRazorpayModule
  if (intentPath === 'pkg-buy' || intentPath === 'buy-booking' || intentPath === 'openBookOrder') {
    await page.evaluate(() => {
      const modal = document.querySelector('#calcFormModal');
      if (!modal || !modal.classList.contains('is-open')) {
        if (window.WoodenMaxQuote) window.WoodenMaxQuote.openBookOrder('booking');
      }
      const form = document.querySelector('#calcLeadForm');
      if (!form) return;
      const set = (name, val) => {
        const el = form.elements[name];
        if (!el) return;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      set('name', 'Wave C1 Test');
      set('mobile', '9876543210');
      set('city', 'Hyderabad');
      set('role', 'Home Owner');
      set('email', 'wavec1@example.com');
      // Native submit event (form has onsubmit="return false" but listener handles it)
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  } else if (intentPath === 'open-estimate') {
    // Sheet open already called ensureRazorpayModule; also tap Book for good measure
    await page.evaluate(() => {
      const book = document.querySelector('[data-cart-action="book-order"]');
      if (book) book.click();
    });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      const form = document.querySelector('#calcLeadForm');
      const modal = document.querySelector('#calcFormModal');
      if (!form || !modal || !modal.classList.contains('is-open')) return;
      const set = (name, val) => {
        const el = form.elements[name];
        if (!el) return;
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };
      set('name', 'Wave C1 Test');
      set('mobile', '9876543210');
      set('city', 'Hyderabad');
      set('role', 'Home Owner');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  }

  const moduleOk = await waitForModule(page, 10000);
  const intentRzp = rzp.filter((x) => x.phase === 'intent');
  const tagCount = await page.evaluate(() =>
    document.querySelectorAll('script[src*="razorpay-checkout.js"]').length
  );

  // Idempotent second ensure (no second network fetch)
  const rzpBeforeDouble = intentRzp.length;
  await page.evaluate(() => {
    // Re-trigger the same loader contract used by purchase CTAs
    return new Promise(function (resolve) {
      var V = '20260729e';
      if (window.WoodenMaxRazorpay &&
        window.WoodenMaxRazorpay.SCRIPT_VERSION === V &&
        typeof window.WoodenMaxRazorpay.startCheckout === 'function') {
        resolve('cached');
        return;
      }
      var existing = document.querySelector('script[src*="razorpay-checkout.js"][data-wm-checkout="' + V + '"]');
      if (existing) {
        resolve('existing-tag');
        return;
      }
      var tag = document.createElement('script');
      tag.src = '/js/razorpay-checkout.js?v=' + V;
      tag.defer = true;
      tag.setAttribute('data-wm-checkout', V);
      tag.onload = tag.onerror = function () { resolve('loaded'); };
      document.body.appendChild(tag);
    });
  });
  await page.waitForTimeout(400);
  const intentRzpAfter = rzp.filter((x) => x.phase === 'intent').length;
  const doubleFetch = intentRzpAfter > rzpBeforeDouble && rzpBeforeDouble >= 1;

  const payConsole = consoleErrors.filter((e) =>
    /razorpay|WoodenMaxRazorpay|Payment script|Payment module/i.test(e)
  );

  // Export-PDF path still available (non-payment)
  const pdfOk = await page.evaluate(() => {
    if (!window.WoodenMaxQuote || typeof window.WoodenMaxQuote.openPdfForm !== 'function') return false;
    try {
      window.WoodenMaxQuote.openPdfForm();
      const modal = document.querySelector('#calcFormModal');
      return modal && modal.getAttribute('data-intent') === 'export-pdf';
    } catch (e) {
      return false;
    }
  });

  await page.close();

  return {
    id: pageSpec.id,
    cold,
    nonpay,
    nonpayRzp,
    intentPath,
    moduleOk,
    intentRzpCount: intentRzp.length,
    uniqueIntent: [...new Set(intentRzp.map((x) => x.url))],
    tagCount,
    doubleFetch,
    payConsole,
    pdfOk,
    consoleErrors: consoleErrors.filter((e) => !/favicon|ResizeObserver|Failed to load resource|net::ERR/i.test(e)).slice(0, 6)
  };
}

(async () => {
  const server = await startServer();
  const browser = await chromium.launch({ headless: true });
  const results = { pages: [], ok: true, failures: [] };

  try {
    for (const p of PAGES) {
      const r = await runPage(browser, p);
      results.pages.push(r);

      if (r.cold.rzpCount !== 0 || r.cold.hasTag || r.cold.hasModule) {
        results.ok = false;
        results.failures.push(r.id + ': COLD loaded Razorpay');
      }
      if (!r.cold.hasUx) {
        results.ok = false;
        results.failures.push(r.id + ': UX missing');
      }
      if (r.nonpayRzp !== 0) {
        results.ok = false;
        results.failures.push(r.id + ': Razorpay on add-to-cart');
      }
      if (!r.moduleOk) {
        results.ok = false;
        results.failures.push(r.id + ': module not ready after intent (' + r.intentPath + ')');
      }
      if (r.intentRzpCount < 1) {
        results.ok = false;
        results.failures.push(r.id + ': no razorpay-checkout.js on intent');
      }
      if (r.intentRzpCount > 1 || r.doubleFetch) {
        results.ok = false;
        results.failures.push(r.id + ': razorpay fetched more than once (' + r.intentRzpCount + ')');
      }
      if (r.tagCount > 1) {
        results.ok = false;
        results.failures.push(r.id + ': duplicate script tags');
      }
      if (r.payConsole.length) {
        results.ok = false;
        results.failures.push(r.id + ': ' + r.payConsole.join(' | '));
      }
      if (!r.pdfOk) {
        results.ok = false;
        results.failures.push(r.id + ': export-pdf path broken');
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  fs.writeFileSync(path.join(ROOT, 'tools/_verify-wave-c1-out.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  console.log(results.ok ? '\nWAVE_C1_OK' : '\nWAVE_C1_FAIL');
  process.exit(results.ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(2);
});
