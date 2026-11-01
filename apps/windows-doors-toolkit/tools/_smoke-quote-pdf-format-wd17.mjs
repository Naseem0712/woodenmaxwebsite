/**
 * WD-17 smoke: Quote PDF/print openings use full W-01 narrative template.
 * Covers Configurator + Quotation + Site Measure Export Quote PDF.
 * Run: node tools/_smoke-quote-pdf-format-wd17.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-quote-pdf-wd17');
mkdirSync(shotDir, { recursive: true });

const mediaDir =
  'C:\\Users\\nasim ahmad\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-8a059652-0882-4ad5-bc64-db92001caa6e\\files\\media';

function assertBlock(text, label) {
  const checks = [
    [/W-01\s+.+,\s+\d+×\d+\s+(mm|inch|ft),\s+qty\s+\d+,\s+area\s+[\d.]+\s+sqft/i, 'header line'],
    [/Window:\s*.+/i, 'Window line'],
    [/Shutter\/door:\s*\d+\s+shutters?\s+Glass\s+\+\s+\d+\s+shutters?\s+mesh/i, 'Shutter/door line'],
    [/Color:\s*.+/i, 'Color line'],
    [/Glass:\s*.+/i, 'Glass line'],
    [/Lock \/ handle type:\s*.+/i, 'Lock / handle line'],
  ];
  const missing = [];
  for (const [re, name] of checks) {
    if (!re.test(text)) missing.push(name);
  }
  // Mesh line only when mesh doors present in sample
  if (/shutter mesh/i.test(text) && !/^Mesh:/m.test(text) && !/\nMesh:/i.test(text)) {
    missing.push('Mesh line');
  }
  if (missing.length) {
    throw new Error(`${label} missing: ${missing.join(', ')}\n---\n${text.slice(0, 1200)}`);
  }
  console.log('ok', label);
  console.log('--- sample ---\n' + text.split('\n').slice(0, 12).join('\n'));
}

async function capturePdfPreview(page, buttonName, outName) {
  await page.addInitScript(() => {
    window.print = () => {};
  });

  const popupPromise = page.waitForEvent('popup', { timeout: 15000 });
  const quoteGroup = page.locator('.export-group').first();
  await quoteGroup.getByRole('button', { name: buttonName }).click();
  const popup = await popupPromise;
  await popup.addInitScript(() => {
    window.print = () => {};
  }).catch(() => {});
  await popup.waitForFunction(
    () => document.querySelector('.opening-block pre, h1') != null,
    null,
    { timeout: 15000 },
  );
  await popup.evaluate(() => {
    window.print = () => {};
  });
  await popup.waitForTimeout(300);

  const html = await popup.content();
  writeFileSync(join(shotDir, `${outName}.html`), html, 'utf8');

  const bodyText = await popup.locator('body').innerText();
  const preCount = await popup.locator('.opening-block pre').count();
  const firstPre = preCount
    ? await popup.locator('.opening-block pre').first().innerText()
    : bodyText;
  if (!firstPre.trim()) {
    throw new Error(`${outName}: empty print body. html length=${html.length}`);
  }
  assertBlock(firstPre, outName);

  const shotPath = join(shotDir, `${outName}.png`);
  await popup.screenshot({ path: shotPath, fullPage: true });
  writeFileSync(join(shotDir, `${outName}.txt`), firstPre, 'utf8');

  await popup.close();
  return { bodyText, firstPre, shotPath, preCount };
}

async function main() {
  const server = await createServer({
    root,
    server: { port: 5197, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const url = 'http://127.0.0.1:5197';
  console.log('dev', url);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Clear persisted state so seed masters drive narrative (glass brand, lock label, mesh).
  await page.addInitScript(() => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('wd-toolkit')) localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  });

  // Configurator
  await page.goto(url + '/configure', { waitUntil: 'networkidle' });
  await page.waitForSelector('.export-toolbar');
  const addBtn = page.getByRole('button', { name: /Add to quote/i });
  if (await addBtn.isEnabled().catch(() => false)) {
    await addBtn.click();
    await page.waitForTimeout(250);
  }
  const cfg = await capturePdfPreview(page, 'PDF · package', 'configurator-quote-pdf');

  // Quotation
  await page.goto(url + '/quote', { waitUntil: 'networkidle' });
  await page.waitForSelector('.export-toolbar');
  const quote = await capturePdfPreview(page, 'PDF · package', 'quotation-quote-pdf');

  // Site Measure
  await page.goto(url + '/site-measure', { waitUntil: 'networkidle' });
  await page.waitForSelector('.export-toolbar');
  const site = await capturePdfPreview(page, 'PDF · package', 'site-measure-quote-pdf');

  if (existsSync(mediaDir)) {
    copyFileSync(quote.shotPath, join(mediaDir, 'toolkit-quote-pdf-w01-preview.png'));
    copyFileSync(cfg.shotPath, join(mediaDir, 'toolkit-quote-pdf-w01-configurator.png'));
    copyFileSync(site.shotPath, join(mediaDir, 'toolkit-quote-pdf-w01-site-measure.png'));
    writeFileSync(
      join(mediaDir, 'toolkit-quote-pdf-w01.json'),
      JSON.stringify(
        {
          ok: true,
          samples: {
            configurator: cfg.firstPre.split('\n').slice(0, 10),
            quotation: quote.firstPre.split('\n').slice(0, 10),
            siteMeasure: site.firstPre.split('\n').slice(0, 10),
          },
          screenshots: [
            'toolkit-quote-pdf-w01-preview.png',
            'toolkit-quote-pdf-w01-configurator.png',
            'toolkit-quote-pdf-w01-site-measure.png',
          ],
        },
        null,
        2,
      ),
      'utf8',
    );
  }

  writeFileSync(
    join(shotDir, 'report.json'),
    JSON.stringify(
      {
        ok: true,
        configuratorBlocks: cfg.preCount,
        quotationBlocks: quote.preCount,
        siteMeasureBlocks: site.preCount,
      },
      null,
      2,
    ),
    'utf8',
  );

  await browser.close();
  await server.close();
  console.log('WD-17 smoke OK', shotDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
