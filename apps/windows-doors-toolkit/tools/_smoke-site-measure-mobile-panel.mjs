/**
 * Site Measure mobile Actions & totals panel smoke.
 * Run: node tools/_smoke-site-measure-mobile-panel.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-site-measure-mobile-panel-shots');
mkdirSync(shotDir, { recursive: true });

const mediaDir =
  'C:\\Users\\nasim ahmad\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-8a059652-0882-4ad5-bc64-db92001caa6e\\files\\media';

async function main() {
  const server = await createServer({
    root,
    server: { port: 5201, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const base = 'http://127.0.0.1:5201';
  console.log('base', base);

  const browser = await chromium.launch({ headless: true });
  const report = { base, mobile: {}, desktop: {}, ok: false };

  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="site-measure-mobile-panel"]', { timeout: 20000 });

    const panel = page.locator('[data-testid="site-measure-mobile-panel"]');
    await panel.waitFor({ state: 'visible' });

    const desktopHidden = await page.locator('.site-measure-desktop-chrome').first().evaluate((el) => {
      return getComputedStyle(el).display === 'none';
    });

    const exportBtns = panel.locator('[data-testid="export-toolbar-panel"] .export-btn-grid .btn');
    const exportCount = await exportBtns.count();
    // Quote package PDF/Excel (2) + BOM ± rates (4) = 6; older Quote ± rates was 8
    if (exportCount < 6) {
      throw new Error(`Expected at least 6 export buttons, got ${exportCount}`);
    }

    const popupPromise = page.waitForEvent('popup', { timeout: 12000 });
    const quotePdf = panel.locator('[data-testid="export-quote-pdf"]');
    if ((await quotePdf.count()) > 0) await quotePdf.click();
    else await exportBtns.first().click();
    const popup = await popupPromise;
    await popup.waitForFunction(() => document.body && document.body.innerText.length > 20, null, {
      timeout: 12000,
    });
    await popup.close();

    if (!(await panel.locator('[data-testid="site-measure-mobile-addons"]').isVisible())) {
      throw new Error('Add-on rates missing in panel');
    }

    const send = panel.locator('[data-testid="site-measure-send-openings"]');
    if (!(await send.isVisible())) throw new Error('Send openings panel missing');
    const pushBtns = send.locator('.site-measure-send-grid .btn');
    if ((await pushBtns.count()) !== 4) throw new Error('Expected 4 send buttons');
    const gridCss = await send.locator('.site-measure-send-grid').evaluate((el) => {
      const st = getComputedStyle(el);
      return { display: st.display, cols: st.gridTemplateColumns };
    });
    if (gridCss.display !== 'grid') {
      throw new Error(`Send grid not CSS grid: ${JSON.stringify(gridCss)}`);
    }
    const helpText = await send.locator('.site-measure-send-help').innerText();
    if (!/net fab size/i.test(helpText)) throw new Error('Missing net fab size helper text');

    await pushBtns.nth(0).click();
    await page.waitForTimeout(250);
    const status = panel.locator('[data-testid="site-measure-send-status"]');
    if (!(await status.isVisible())) throw new Error('Send status missing after Quote click');

    const kpis = panel.locator('[data-testid="site-measure-mobile-kpis"]');
    const kpiBox = await kpis.boundingBox();
    const pushBox = await panel.locator('[data-testid="site-measure-mobile-push"]').boundingBox();
    if (!kpiBox || !pushBox) throw new Error('KPI / push boxes missing');
    if (kpiBox.y < pushBox.y) throw new Error('KPIs must sit at bottom of panel (below send)');

    await panel.locator('summary').click();
    await page.waitForTimeout(120);
    if (await panel.evaluate((el) => el.open)) throw new Error('Panel should close on summary click');
    await panel.locator('summary').click();
    await page.waitForTimeout(80);

    await panel.screenshot({ path: join(shotDir, 'mobile-actions-panel.png') });
    await page.screenshot({ path: join(shotDir, 'mobile-site-measure-with-panel.png'), fullPage: true });

    report.mobile = {
      desktopHidden,
      exportCount,
      sendGrid: gridCss,
      kpiBelowPush: kpiBox.y > pushBox.y,
      notesVisible: await page
        .locator('[data-testid="opening-notes"]')
        .first()
        .isVisible()
        .catch(() => false),
    };
    console.log('ok mobile panel', report.mobile);
    await page.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    const panelHidden = await page
      .locator('[data-testid="site-measure-mobile-panel"]')
      .evaluate((el) => getComputedStyle(el).display === 'none');
    const desktopExport = await page
      .locator('.site-measure-desktop-chrome .export-toolbar')
      .first()
      .isVisible();
    report.desktop = { panelHidden, desktopExport };
    if (!panelHidden) throw new Error('Mobile panel should be hidden on desktop');
    if (!desktopExport) throw new Error('Desktop export toolbar missing');
    await page.screenshot({ path: join(shotDir, 'desktop-site-measure.png'), fullPage: false });
    console.log('ok desktop', report.desktop);
    await page.close();
  }

  report.ok = true;
  writeFileSync(join(shotDir, 'panel-report.json'), JSON.stringify(report, null, 2));
  if (existsSync(mediaDir)) {
    for (const [src, dest] of [
      ['mobile-actions-panel.png', 'toolkit-site-measure-mobile-actions-panel.png'],
      ['mobile-site-measure-with-panel.png', 'toolkit-site-measure-mobile-panel-full.png'],
      ['desktop-site-measure.png', 'toolkit-site-measure-desktop-with-chrome.png'],
      ['panel-report.json', 'toolkit-site-measure-mobile-panel.json'],
    ]) {
      const from = join(shotDir, src);
      if (existsSync(from)) copyFileSync(from, join(mediaDir, dest));
    }
  }

  await browser.close();
  await server.close();
  console.log('Site Measure mobile panel smoke OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
