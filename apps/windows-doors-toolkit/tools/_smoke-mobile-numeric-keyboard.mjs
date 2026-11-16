/**
 * Smoke: numeric fields open the mobile number keyboard via inputMode.
 * Asserts NumberInput / Input type="number" render as type=text + inputMode
 * decimal|numeric|tel, and no raw input[type=number] remains on key pages.
 *
 * Run: node tools/_smoke-mobile-numeric-keyboard.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'tools', '_smoke-mobile-numeric-keyboard-out');
mkdirSync(outDir, { recursive: true });

const PAGES = [
  '/site-measure',
  '/configure',
  '/settings/allowances',
  '/settings/business',
  '/settings/series',
  '/settings/master',
  '/openings',
  '/leads',
  '/stock',
];

async function probe(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  let base = 'http://127.0.0.1:5173';
  let server = null;
  if (!(await probe(base + '/'))) {
    server = await createServer({
      root,
      server: { port: 5194, strictPort: true },
      logLevel: 'error',
    });
    await server.listen();
    base = 'http://127.0.0.1:5194';
  }
  console.log('base', base);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  const report = { base, pages: {}, ok: false, errors: [] };

  for (const path of PAGES) {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    // Vendor/mode gates may show a modal — dismiss cancel if present so page content loads
    const cancel = page.locator('.modal-card-verify-actions button', { hasText: 'Cancel' });
    if (await cancel.count()) {
      await cancel.first().click().catch(() => {});
    }

    const snap = await page.evaluate(() => {
      const allowedModes = new Set(['decimal', 'numeric', 'tel']);
      const typedNumber = [...document.querySelectorAll('input[type="number"]')].map((el) => ({
        name: el.getAttribute('name'),
        className: el.className,
        testid: el.getAttribute('data-testid'),
      }));
      const marked = [...document.querySelectorAll('input[data-numeric="1"]')].map((el) => ({
        type: el.getAttribute('type'),
        inputMode: el.getAttribute('inputmode') || el.inputMode,
        dataMode: el.getAttribute('data-inputmode'),
        className: el.className,
      }));
      const yellowLike = [...document.querySelectorAll('input.input.tone-in, .tone-in input.input')].map(
        (el) => ({
          type: el.getAttribute('type'),
          inputMode: el.getAttribute('inputmode') || el.inputMode,
          dataNumeric: el.getAttribute('data-numeric'),
          className: el.className,
        }),
      );
      const badMarked = marked.filter(
        (m) => m.type !== 'text' || !allowedModes.has(String(m.inputMode || '').toLowerCase()),
      );
      const badYellowNumeric = yellowLike.filter((y) => {
        // text/date/checkbox/file stay non-numeric; only flag yellow fields that look numeric
        if (y.type === 'date' || y.type === 'checkbox' || y.type === 'file' || y.type === 'email') {
          return false;
        }
        if (y.dataNumeric === '1') {
          return y.type !== 'text' || !allowedModes.has(String(y.inputMode || '').toLowerCase());
        }
        // Yellow text fields (names/notes) are fine without inputMode
        return false;
      });
      return {
        typedNumberCount: typedNumber.length,
        typedNumber,
        markedCount: marked.length,
        badMarked,
        badYellowNumeric,
        sampleMarked: marked.slice(0, 5),
      };
    });

    const pageErrors = [];
    if (snap.typedNumberCount > 0) {
      pageErrors.push(`raw input[type=number] count=${snap.typedNumberCount}`);
    }
    if (snap.badMarked.length) {
      pageErrors.push(`bad data-numeric inputs: ${JSON.stringify(snap.badMarked.slice(0, 3))}`);
    }
    if (snap.badYellowNumeric.length) {
      pageErrors.push(`bad yellow numerics: ${JSON.stringify(snap.badYellowNumeric.slice(0, 3))}`);
    }
    if (snap.markedCount === 0 && path !== '/leads') {
      // Leads may have no NumberInput; other pages should expose at least one numeric
      // Soft-warn only when we expect rates (site-measure / configure / settings)
      if (
        path.includes('site-measure') ||
        path.includes('configure') ||
        path.includes('settings') ||
        path.includes('openings') ||
        path.includes('stock')
      ) {
        pageErrors.push('expected at least one data-numeric=1 field');
      }
    }

    report.pages[path] = { ...snap, pageErrors };
    if (pageErrors.length) report.errors.push({ path, pageErrors });
    console.log(
      path,
      'marked=',
      snap.markedCount,
      'type=number=',
      snap.typedNumberCount,
      pageErrors.length ? 'FAIL' : 'ok',
    );
  }

  report.ok = report.errors.length === 0;
  writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  if (server) await server.close();

  if (!report.ok) {
    console.error('FAIL', JSON.stringify(report.errors, null, 2));
    process.exit(1);
  }
  console.log('OK mobile numeric keyboard smoke');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
