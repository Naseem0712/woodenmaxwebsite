/**
 * Browser smoke: GST toggle · footer · custom · panels on Quote/Configure/Site Measure.
 * Run: node tools/_smoke-quote-enhance-gst-discount.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-quote-enhance');
mkdirSync(shotDir, { recursive: true });

const mediaDir =
  'C:\\Users\\nasim ahmad\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-8a059652-0882-4ad5-bc64-db92001caa6e\\files\\media';

async function main() {
  const server = await createServer({
    root,
    server: { port: 5199, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const base = 'http://127.0.0.1:5199';
  const browser = await chromium.launch({ headless: true });
  const report = { base, ok: false, checks: {} };

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('wd-toolkit')) localStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
  });

  await page.goto(base + '/quote', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="quote-extras-panel"]');
  await page.locator('[data-testid="quote-apply-gst"]').selectOption('No');
  await page.waitForTimeout(200);
  await page.locator('[data-testid="quote-apply-gst"]').selectOption('Yes');
  await page.locator('[data-testid="quote-description"]').fill('Smoke description for PDF footer');
  await page.locator('[data-testid="quote-terms"]').fill('Smoke terms 40% advance');
  await page.locator('[data-testid="quote-bank"]').fill('Bank Smoke · IFSC SMOK0001');
  report.checks.footerInputs = true;

  const before = await page.locator('[data-testid="quote-custom-row"]').count();
  await page.locator('[data-testid="quote-add-custom"]').click();
  await page.waitForTimeout(200);
  const after = await page.locator('[data-testid="quote-custom-row"]').count();
  if (after <= before) throw new Error('Custom line did not add');
  await page.locator('[data-testid="quote-custom-row"]').last().locator('input').first().fill('Smoke pergola');
  report.checks.customProduct = true;

  const disc = page.locator('[data-testid="opening-discount-percent"]').first();
  if ((await disc.count()) > 0) {
    await disc.click();
    await disc.fill('10');
    await disc.blur();
    report.checks.openingDiscount = true;
  }

  const quoteShot = join(shotDir, 'quote-extras.png');
  await page.screenshot({ path: quoteShot, fullPage: true });

  await page.goto(base + '/configure', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="quote-extras-panel"]');
  report.checks.configuratorPanel = true;
  const cfgShot = join(shotDir, 'configurator-extras.png');
  await page.screenshot({ path: cfgShot, fullPage: false });

  await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="quote-extras-panel"]');
  report.checks.siteMeasurePanel = true;
  const siteShot = join(shotDir, 'site-measure-extras.png');
  await page.screenshot({ path: siteShot, fullPage: false });

  if (existsSync(mediaDir)) {
    mkdirSync(mediaDir, { recursive: true });
    copyFileSync(quoteShot, join(mediaDir, 'toolkit-quote-enhance-gst-discount.png'));
    copyFileSync(cfgShot, join(mediaDir, 'toolkit-quote-enhance-configurator.png'));
    copyFileSync(siteShot, join(mediaDir, 'toolkit-quote-enhance-site-measure.png'));
    writeFileSync(join(mediaDir, 'toolkit-quote-enhance-gst-discount.json'), JSON.stringify(report, null, 2));
  }

  report.ok = true;
  writeFileSync(join(shotDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  await browser.close();
  await server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
