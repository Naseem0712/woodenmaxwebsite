/**
 * WD-18 smoke: Site Measure openings render as stacked cards on mobile (no wide table),
 * desktop keeps the table. Screenshots → store media/.
 *
 * Run: node tools/_smoke-site-measure-mobile-cards-wd18.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-site-measure-mobile-cards-shots');
mkdirSync(shotDir, { recursive: true });

const mediaDir =
  'C:\\Users\\nasim ahmad\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-8a059652-0882-4ad5-bc64-db92001caa6e\\files\\media';

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
      server: { port: 5193, strictPort: true },
      logLevel: 'error',
    });
    await server.listen();
    base = 'http://127.0.0.1:5193';
  }
  console.log('base', base);

  const browser = await chromium.launch({ headless: true });
  const report = { base, mobile: {}, desktop: {}, ok: false };

  // —— Mobile: stacked cards, table hidden ——
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="site-measure-opening-cards"]');

    // Ensure openings tab
    const openingsChip = page.locator('.chip', { hasText: 'Site Measure' });
    if (await openingsChip.count()) await openingsChip.first().click();

    const cards = page.locator('.site-measure-opening-card');
    await cards.first().waitFor({ state: 'visible', timeout: 8000 });
    const cardCount = await cards.count();
    const cardsVisible = await cards.first().isVisible();
    const tableVisible = await page.locator('.site-measure-openings-table').isVisible().catch(() => false);
    const tableDisplay = await page.locator('.site-measure-openings-table').evaluate((el) => {
      return getComputedStyle(el).display;
    });
    const cardsDisplay = await page
      .locator('.site-measure-openings-cards')
      .evaluate((el) => getComputedStyle(el).display);

    // No page-level horizontal overflow from openings
    const overflow = await page.evaluate(() => {
      const main = document.querySelector('.main');
      return {
        scrollWidth: main?.scrollWidth ?? 0,
        clientWidth: main?.clientWidth ?? 0,
        bodyScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.documentElement.clientWidth,
      };
    });

    // Card field labels present on first card
    const firstText = (await cards.first().innerText()).toLowerCase();
    const labels = [
      'location',
      'size',
      'type',
      'less w',
      'less h',
      'glass',
      'glass doors',
      'mesh',
      'rates / amount',
    ];
    const missingLabels = labels.filter((l) => !firstText.includes(l));

    report.mobile = {
      cardCount,
      cardsVisible,
      tableVisible,
      tableDisplay,
      cardsDisplay,
      overflow,
      noWideTable: tableDisplay === 'none' && cardsVisible && cardCount >= 1,
      noPageHScroll: overflow.bodyScrollWidth <= overflow.bodyClientWidth + 2,
      missingLabels,
    };

    await page.screenshot({
      path: join(shotDir, 'mobile-site-measure-opening-cards.png'),
      fullPage: false,
    });
    // Scroll to rates on first card
    await cards.first().locator('.site-measure-opening-rates').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: join(shotDir, 'mobile-site-measure-opening-card-rates.png'),
      fullPage: false,
    });
    await page.screenshot({
      path: join(shotDir, 'mobile-site-measure-opening-cards-full.png'),
      fullPage: true,
    });
    await page.close();
  }

  // —— Desktop: table visible, cards hidden ——
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    await page.waitForSelector('.site-measure-openings-table');

    const tableVisible = await page.locator('.site-measure-openings-table').isVisible();
    const cardsDisplay = await page
      .locator('.site-measure-openings-cards')
      .evaluate((el) => getComputedStyle(el).display);
    const tableRows = await page.locator('.site-measure-openings-table tbody tr').count();

    report.desktop = {
      tableVisible,
      cardsDisplay,
      tableRows,
      keepsTable: tableVisible && cardsDisplay === 'none' && tableRows >= 1,
    };

    await page.screenshot({
      path: join(shotDir, 'desktop-site-measure-openings-table.png'),
      fullPage: false,
    });
    await page.close();
  }

  await browser.close();
  if (server) await server.close();

  report.ok =
    !!report.mobile.noWideTable &&
    !!report.mobile.noPageHScroll &&
    (report.mobile.missingLabels || []).length === 0 &&
    !!report.desktop.keepsTable;

  writeFileSync(join(shotDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  // Copy screenshots into Project store media/
  if (existsSync(mediaDir)) {
    const copies = [
      ['mobile-site-measure-opening-cards.png', 'toolkit-site-measure-mobile-cards.png'],
      ['mobile-site-measure-opening-card-rates.png', 'toolkit-site-measure-mobile-card-rates.png'],
      ['mobile-site-measure-opening-cards-full.png', 'toolkit-site-measure-mobile-cards-full.png'],
      ['desktop-site-measure-openings-table.png', 'toolkit-site-measure-desktop-table.png'],
    ];
    for (const [from, to] of copies) {
      const src = join(shotDir, from);
      if (existsSync(src)) copyFileSync(src, join(mediaDir, to));
    }
    writeFileSync(join(mediaDir, 'toolkit-site-measure-mobile-cards-wd18.json'), JSON.stringify(report, null, 2));
  }

  if (!report.ok) {
    console.error('WD-18 smoke FAILED');
    process.exit(1);
  }
  console.log('WD-18 smoke OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
