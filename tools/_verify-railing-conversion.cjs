/**
 * Railing conversion-path gates — staircase + balcony at 390/768/1366/1440.
 * Run: node tools/_verify-railing-conversion.cjs [baseUrl]
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:8788';
const PAGES = [
  {
    slug: 'staircase',
    path: '/products/glass-railing/staircase-glass-railing',
    calcId: 'price-calculator-glass-railing-staircase',
    height: '2.5',
    length: '12'
  },
  {
    slug: 'balcony',
    path: '/products/glass-railing/balcony-glass-railing',
    calcId: 'price-calculator-glass-railing-balcony',
    height: '3.5',
    length: '12'
  }
];
const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1366', width: 1366, height: 768 },
  { name: '1440', width: 1440, height: 900 }
];

function ok(label, cond, detail) {
  const d = detail ? ': ' + detail : '';
  console.log((cond ? 'PASS' : 'FAIL') + ' | ' + label + d);
  return !!cond;
}

async function seoSnapshot(page) {
  return page.evaluate(() => {
    const title = document.title || '';
    const canonical = (document.querySelector('link[rel="canonical"]') || {}).href || '';
    const h1 = (document.querySelector('h1') || {}).textContent || '';
    const metaDesc = (document.querySelector('meta[name="description"]') || {}).content || '';
    return { title, canonical, h1: h1.trim().slice(0, 120), metaDesc: metaDesc.slice(0, 120) };
  });
}

async function auditCtas(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      if (!el) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const hero = document.querySelector('.wm-railing-hero-cta');
    const next = document.querySelector('#wm-rail-calc-next');
    const final = document.querySelector('.wm-rail-final-cta');
    const sticky = document.getElementById('calcStickyBar');
    const form = document.getElementById('calc-user-form');
    const waAnchors = [...document.querySelectorAll('a[href*="wa.me"]')].filter(
      (a) => !(a.closest('footer') || a.closest('nav') || a.closest('.wm-footer') || a.closest('.navbar'))
    );
    const railWaBtns = [...document.querySelectorAll('[data-wm-rail-action="whatsapp"]')];
    const callLinks = [...document.querySelectorAll('a[href^="tel:"]')].filter(visible);
    return {
      heroVisible: visible(hero),
      heroKids: hero
        ? [...hero.children].map((el) => ({
            text: (el.textContent || '').trim().slice(0, 40),
            display: getComputedStyle(el).display,
            tag: el.tagName,
            action: el.getAttribute('data-wm-rail-action') || ''
          }))
        : [],
      nextVisible: visible(next),
      finalVisible: visible(final),
      stickyExists: !!sticky,
      formHidden: !form || getComputedStyle(form).display === 'none' || form.getAttribute('aria-hidden') === 'true',
      bodyWaAnchorsVisible: waAnchors.filter(visible).length,
      railWaVisible: railWaBtns.filter(visible).length,
      callVisible: callLinks.length
    };
  });
}

async function runCalc(page, cfg) {
  await page.fill('#calc-height', cfg.height);
  await page.fill('#calc-length-1', cfg.length);
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const total = (document.getElementById('calc-result-total') || {}).textContent || '';
    const per = (document.getElementById('calc-result-per-rft') || {}).textContent || '';
    return { total, per, hasRupee: /₹/.test(total) && !/₹0\b/.test(total.replace(/,/g, '')) };
  });
}

async function clickAndCountEvents(page, selector, expectNames) {
  await page.evaluate(() => {
    window.__wmGaEvents = [];
    if (!window.__wmGaPatched) {
      window.__wmGaPatched = true;
      window.__wmGaOrig = window.gtag;
      window.gtag = function () {
        try {
          if (arguments[0] === 'event') {
            window.__wmGaEvents.push({ name: arguments[1], params: arguments[2] || {} });
          }
        } catch (e) {}
        if (typeof window.__wmGaOrig === 'function') return window.__wmGaOrig.apply(this, arguments);
      };
    }
  });
  const popupPromise = page.waitForEvent('popup', { timeout: 3000 }).catch(() => null);
  await page.locator(selector).first().click({ force: false });
  const popup = await popupPromise;
  if (popup) await popup.close().catch(() => {});
  await page.waitForTimeout(300);
  const fired = await page.evaluate(() => window.__wmGaEvents || []);
  const counts = {};
  fired.forEach((e) => {
    counts[e.name] = (counts[e.name] || 0) + 1;
  });
  const okOnce = expectNames.every((n) => (counts[n] || 0) === 1);
  return { okOnce, counts, fired: fired.map((e) => e.name) };
}

(async () => {
  let pass = true;
  const browser = await chromium.launch({ headless: true });
  const seoBefore = {};

  for (const cfg of PAGES) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(BASE + cfg.path, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('#' + cfg.calcId, { timeout: 20000 });
    await page.waitForTimeout(1200);

    seoBefore[cfg.slug] = await seoSnapshot(page);
    console.log('\n=== ' + cfg.slug.toUpperCase() + ' ===');
    pass = ok(cfg.slug + ' SEO title', !!seoBefore[cfg.slug].title) && pass;
    pass = ok(cfg.slug + ' SEO canonical', /glass-railing/.test(seoBefore[cfg.slug].canonical)) && pass;
    pass = ok(cfg.slug + ' SEO h1', /glass railing/i.test(seoBefore[cfg.slug].h1)) && pass;

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);
      const audit = await auditCtas(page);
      pass = ok(cfg.slug + ' @' + vp.name + ' hero visible', audit.heroVisible) && pass;
      pass =
        ok(
          cfg.slug + ' @' + vp.name + ' WA buttons visible',
          audit.railWaVisible >= 1,
          'n=' + audit.railWaVisible
        ) && pass;
      pass =
        ok(cfg.slug + ' @' + vp.name + ' call visible', audit.callVisible >= 1, 'n=' + audit.callVisible) &&
        pass;
      pass = ok(cfg.slug + ' @' + vp.name + ' next-step visible', audit.nextVisible) && pass;
      pass = ok(cfg.slug + ' @' + vp.name + ' final CTA visible', audit.finalVisible) && pass;
      pass =
        ok(
          cfg.slug + ' @' + vp.name + ' no body wa.me anchors',
          audit.bodyWaAnchorsVisible === 0,
          'n=' + audit.bodyWaAnchorsVisible
        ) && pass;
      const heroHidden = (audit.heroKids || []).filter((k) => k.display === 'none');
      pass =
        ok(cfg.slug + ' @' + vp.name + ' hero kids all shown', heroHidden.length === 0, JSON.stringify(heroHidden)) &&
        pass;
    }

    await page.setViewportSize({ width: 390, height: 844 });
    const calc = await runCalc(page, cfg);
    pass = ok(cfg.slug + ' calculator total', calc.hasRupee, calc.total + ' | ' + calc.per) && pass;

    const waClick = await clickAndCountEvents(
      page,
      '[data-wm-rail-action="whatsapp"]',
      ['wm_whatsapp_click', 'generate_lead']
    );
    pass =
      ok(
        cfg.slug + ' WA event once',
        waClick.okOnce,
        JSON.stringify(waClick.counts)
      ) && pass;

    const callClick = await clickAndCountEvents(page, '.wm-railing-hero-cta a[href^="tel:"]', [
      'wm_phone_click'
    ]);
    pass =
      ok(cfg.slug + ' phone event once', callClick.okOnce, JSON.stringify(callClick.counts)) && pass;

    const seoAfter = await seoSnapshot(page);
    pass =
      ok(
        cfg.slug + ' SEO unchanged after calc',
        seoAfter.title === seoBefore[cfg.slug].title &&
          seoAfter.canonical === seoBefore[cfg.slug].canonical &&
          seoAfter.h1 === seoBefore[cfg.slug].h1
      ) && pass;

    const serious = errors.filter(
      (e) => !/favicon|net::ERR|Failed to load resource|gtag|googletagmanager/i.test(e)
    );
    pass = ok(cfg.slug + ' no console errors', serious.length === 0, serious.slice(0, 3).join(' | ')) && pass;

    await context.close();
  }

  await browser.close();
  const out = { pass, seoBefore, base: BASE };
  fs.writeFileSync(path.join(__dirname, '_verify-railing-conversion-out.json'), JSON.stringify(out, null, 2));
  console.log('\n' + (pass ? 'ALL GATES PASS' : 'GATES FAILED'));
  process.exit(pass ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
