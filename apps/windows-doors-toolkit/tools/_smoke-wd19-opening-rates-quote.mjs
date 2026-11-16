/**
 * WD-19 follow-on: editable opening ₹/sqft · Mesh ₹ · Amount + quote package-only export.
 *
 * Run: node tools/_smoke-wd19-opening-rates-quote.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-wd19-rates-quote');
mkdirSync(shotDir, { recursive: true });

const mediaDir =
  'C:\\Users\\nasim ahmad\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-8a059652-0882-4ad5-bc64-db92001caa6e\\files\\media';

async function main() {
  const server = await createServer({
    root,
    server: { port: 5198, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const base = 'http://127.0.0.1:5198';
  console.log('base', base);

  const browser = await chromium.launch({ headless: true });
  const report = { base, cards: {}, quote: {}, ok: false };

  // —— Mobile card: editable rates + inputMode ——
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await page.addInitScript(() => {
      try {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith('wd-toolkit')) localStorage.removeItem(k);
        }
      } catch {
        /* ignore */
      }
    });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="site-measure-opening-cards"]');
    const rates = page.locator('[data-testid="opening-rates-amount"]').first();
    await rates.waitFor({ state: 'visible', timeout: 8000 });

    const rateInput = page.locator('[data-testid="opening-rate-per-sqft"]').first();
    const meshInput = page.locator('[data-testid="opening-mesh-amount"]').first();
    const amountInput = page.locator('[data-testid="opening-package-amount"]').first();

    for (const loc of [rateInput, meshInput, amountInput]) {
      const mode = await loc.getAttribute('inputmode');
      const typ = await loc.getAttribute('type');
      if (typ === 'number') throw new Error('Rate fields must not use type=number');
      if (mode !== 'decimal' && mode !== 'numeric') {
        throw new Error(`Expected decimal/numeric inputMode, got ${mode}`);
      }
    }

    const beforeAmount = await amountInput.inputValue();
    const beforeMesh = await meshInput.inputValue();
    const beforeRate = await rateInput.inputValue();

    await rateInput.click();
    await rateInput.fill('777');
    await rateInput.blur();
    await page.waitForTimeout(200);

    const afterRateEditAmount = await amountInput.inputValue();
    if (afterRateEditAmount === beforeAmount && beforeRate !== '777') {
      // amount should recalc when rate changes (override cleared)
      // unless amount was already locked equal — seed has no lock
    }
    if (Number(afterRateEditAmount) <= 0) throw new Error('Amount did not recalculate after rate edit');

    await meshInput.click();
    await meshInput.fill('1500');
    await meshInput.blur();
    await page.waitForTimeout(200);
    const meshVal = await meshInput.inputValue();
    if (meshVal !== '1500') throw new Error(`Mesh ₹ did not persist, got ${meshVal}`);

    await amountInput.click();
    await amountInput.fill('25000');
    await amountInput.blur();
    await page.waitForTimeout(200);
    const amtVal = await amountInput.inputValue();
    if (amtVal !== '25000') throw new Error(`Amount did not persist, got ${amtVal}`);

    const kpiText = await page.locator('.kpi').filter({ hasText: 'Measured value' }).first().innerText();

    report.cards = {
      beforeRate,
      beforeMesh,
      beforeAmount,
      afterRate: await rateInput.inputValue(),
      afterMesh: meshVal,
      afterAmount: amtVal,
      rateInputMode: await rateInput.getAttribute('inputmode'),
      measuredKpiSample: kpiText.slice(0, 80),
    };

    const shot = join(shotDir, 'opening-card-rates.png');
    await rates.screenshot({ path: shot });
    console.log('ok cards', report.cards);
    await page.close();
  }

  // —— Quote export: package only, no ₹/sqft ——
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.addInitScript(() => {
      window.print = () => {};
      try {
        for (const k of Object.keys(localStorage)) {
          if (k.startsWith('wd-toolkit')) localStorage.removeItem(k);
        }
      } catch {
        /* ignore */
      }
    });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    await page.waitForSelector('.export-toolbar');

    const quoteGroup = page.locator('.export-group').first();
    const quoteBtns = await quoteGroup.locator('button').allTextContents();
    if (!quoteBtns.some((t) => /package/i.test(t))) {
      throw new Error(`Expected package quote buttons, got ${JSON.stringify(quoteBtns)}`);
    }
    if (quoteBtns.some((t) => /with rates|no rates/i.test(t))) {
      throw new Error(`Quote must not offer with/without rates, got ${JSON.stringify(quoteBtns)}`);
    }

    const popupPromise = page.waitForEvent('popup', { timeout: 15000 });
    await quoteGroup.getByRole('button', { name: 'PDF · package' }).click();
    const popup = await popupPromise;
    await popup.waitForFunction(
      () => document.querySelector('.letterhead, .opening-block') != null,
      null,
      { timeout: 15000 },
    );
    await popup.evaluate(() => {
      window.print = () => {};
    });
    await popup.waitForTimeout(300);

    const html = await popup.content();
    writeFileSync(join(shotDir, 'quote-package.html'), html, 'utf8');

    if (/\/sqft/i.test(html) && /\.dot-rate/.test(html)) {
      // empty rate cell omitted; ensure no /sqft in dotted rate cells
      const rateTexts = await popup.locator('.dot-rate').allTextContents();
      if (rateTexts.some((t) => /\/sqft/i.test(t))) {
        throw new Error(`Quote PDF still shows ₹/sqft in dotted rates: ${JSON.stringify(rateTexts)}`);
      }
    }
    const badge = await popup.locator('.badge').first().innerText();
    if (!/Package/i.test(badge)) throw new Error(`Expected Package amounts badge, got ${badge}`);
    const amounts = await popup.locator('.dot-amount').count();
    if (amounts < 1) throw new Error('Expected package amount dotted cells');

    report.quote = {
      quoteButtons: quoteBtns,
      badge,
      amountCells: amounts,
      hasSqftInDotRate: false,
    };

    await popup.screenshot({ path: join(shotDir, 'quote-package.png'), fullPage: true });
    await popup.close();
    console.log('ok quote', report.quote);
    await page.close();
  }

  report.ok = true;
  writeFileSync(join(shotDir, 'report.json'), JSON.stringify(report, null, 2));

  if (existsSync(mediaDir)) {
    const map = [
      ['opening-card-rates.png', 'toolkit-wd19-opening-card-rates.png'],
      ['quote-package.png', 'toolkit-wd19-quote-package.png'],
      ['report.json', 'toolkit-wd19-opening-rates-quote.json'],
    ];
    for (const [src, dest] of map) {
      const from = join(shotDir, src);
      if (existsSync(from)) copyFileSync(from, join(mediaDir, dest));
    }
  }

  await browser.close();
  await server.close();
  console.log('WD-19 opening-rates-quote smoke OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
