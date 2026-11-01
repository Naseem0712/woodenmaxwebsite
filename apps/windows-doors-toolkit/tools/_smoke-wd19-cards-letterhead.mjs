/**
 * WD-19 smoke: compact 2-col Site Measure mobile cards + Notes,
 * Quote PDF letterhead (GST capital) + dotted rate/amount rows.
 *
 * Run: node tools/_smoke-wd19-cards-letterhead.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-wd19-shots');
mkdirSync(shotDir, { recursive: true });

const mediaDir =
  'C:\\Users\\nasim ahmad\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-8a059652-0882-4ad5-bc64-db92001caa6e\\files\\media';

async function main() {
  // Always serve THIS tree on a dedicated port (avoid stale 5173 from another copy).
  const server = await createServer({
    root,
    server: { port: 5199, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const base = 'http://127.0.0.1:5199';
  console.log('base', base);

  const browser = await chromium.launch({ headless: true });
  const report = { base, mobileCards: {}, letterhead: {}, ok: false };

  // —— Mobile cards: 2-col + Notes ——
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="site-measure-opening-cards"]');
    const cards = page.locator('.site-measure-opening-card');
    await cards.first().waitFor({ state: 'visible', timeout: 8000 });

    const notesVisible = await page.locator('[data-testid="opening-notes"]').first().isVisible();
    const gridCols = await page.locator('.site-measure-opening-card .grid-2').first().evaluate((el) => {
      return getComputedStyle(el).gridTemplateColumns;
    });
    const cardBox = await cards.first().boundingBox();
    const fieldCount = await cards.first().locator('.field').count();

    // Two equal-ish columns (not single 1fr)
    const isTwoCol = /px/.test(gridCols) && !/^[\d.]+px$/.test(gridCols.trim());
    const colParts = gridCols.split(' ').filter(Boolean);
    const twoCol = colParts.length >= 2;

    report.mobileCards = {
      notesVisible,
      gridTemplateColumns: gridCols,
      twoCol,
      isTwoCol,
      cardHeight: cardBox?.height ?? null,
      fieldCount,
    };

    if (!notesVisible) throw new Error('Notes field missing on mobile opening card');
    if (!twoCol) throw new Error(`Expected 2-col grid, got: ${gridCols}`);

    await page.locator('[data-testid="opening-notes"]').first().fill('WD-19 site note');
    const shotCards = join(shotDir, 'mobile-cards-compact.png');
    await cards.first().screenshot({ path: shotCards });
    console.log('ok mobile cards', report.mobileCards);
    await page.close();
  }

  // —— Quote PDF letterhead + dotted rate rows (Business Settings fields on seed) ——
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
    await page.goto(base + '/quote', { waitUntil: 'networkidle' });
    await page.waitForSelector('.export-toolbar');

    const popupPromise = page.waitForEvent('popup', { timeout: 15000 });
    const quoteGroup = page.locator('.export-group').first();
    await quoteGroup.getByRole('button', { name: 'PDF · with rates' }).click();
    const popup = await popupPromise;
    await popup.waitForFunction(
      () => document.querySelector('.letterhead, .opening-block, h1') != null,
      null,
      { timeout: 15000 },
    );
    await popup.evaluate(() => {
      window.print = () => {};
    });
    await popup.waitForTimeout(400);

    const html = await popup.content();
    writeFileSync(join(shotDir, 'quote-letterhead.html'), html, 'utf8');

    const hasLetterhead = await popup.locator('.letterhead').count();
    const gstLabel = await popup.locator('.gst-label').first().innerText().catch(() => '');
    const hasDotRow = await popup.locator('.dot-row').count();
    const bodyPad = await popup.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { paddingLeft: s.paddingLeft, paddingRight: s.paddingRight, margin: s.margin };
    });
    const narrative = await popup.locator('.opening-block pre').first().innerText().catch(() => '');

    report.letterhead = {
      hasLetterhead: hasLetterhead > 0,
      gstLabel,
      dotRows: hasDotRow,
      bodyPad,
      narrativeSample: narrative.split('\n').slice(0, 4).join(' | '),
    };

    if (!hasLetterhead) throw new Error('Quote PDF missing .letterhead');
    if (gstLabel !== 'GST') throw new Error(`Expected GST capital label, got "${gstLabel}"`);
    if (hasDotRow < 1) throw new Error('Expected dotted rate/summary rows');
    if (!/W-01/i.test(narrative)) throw new Error('W-01 narrative missing in letterhead PDF');

    const shotPdf = join(shotDir, 'quote-letterhead.png');
    await popup.screenshot({ path: shotPdf, fullPage: true });
    await popup.close();
    console.log('ok letterhead', report.letterhead);
    await page.close();
  }

  report.ok = true;
  writeFileSync(join(shotDir, 'wd19-report.json'), JSON.stringify(report, null, 2));

  if (existsSync(mediaDir)) {
    const map = [
      ['mobile-cards-compact.png', 'toolkit-wd19-mobile-cards-compact.png'],
      ['quote-letterhead.png', 'toolkit-wd19-quote-letterhead.png'],
      ['wd19-report.json', 'toolkit-wd19-cards-letterhead.json'],
    ];
    for (const [src, dest] of map) {
      const from = join(shotDir, src);
      if (existsSync(from)) copyFileSync(from, join(mediaDir, dest));
    }
  }

  await browser.close();
  await server.close();
  console.log('WD-19 smoke OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
