/**
 * WD-16 smoke: mobile drawer, desktop independent scroll, export visible on Site Measure + Configurator.
 * Prefer existing Vite on 5173; otherwise spins a local vite on 5192.
 *
 * Run: node tools/_smoke-shell-export-wd16.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-shell-export-shots');
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
      server: { port: 5192, strictPort: true },
      logLevel: 'error',
    });
    await server.listen();
    base = 'http://127.0.0.1:5192';
  }
  console.log('base', base);

  const browser = await chromium.launch({ headless: true });
  const report = {
    base,
    mobile: {},
    desktop: {},
    exports: {},
  };

  // —— Mobile: hamburger + collapsed sidebar by default ——
  {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    await page.waitForSelector('.mobile-nav-toggle');
    const shellClass = await page.locator('.shell').getAttribute('class');
    const sidebarBox = await page.locator('.sidebar').boundingBox();
    const toggleVisible = await page.locator('.mobile-nav-toggle').isVisible();
    const navOpenDefault = (shellClass || '').includes('nav-open');
    report.mobile.defaultCollapsed = !navOpenDefault && toggleVisible;
    report.mobile.sidebarOffscreen =
      !sidebarBox || sidebarBox.x + sidebarBox.width <= 8 || sidebarBox.x < -40;

    await page.locator('.mobile-nav-toggle').click();
    await page.waitForTimeout(250);
    const openClass = await page.locator('.shell').getAttribute('class');
    const openBox = await page.locator('.sidebar').boundingBox();
    report.mobile.opensDrawer = (openClass || '').includes('nav-open') && !!openBox && openBox.x >= -2;

    await page.screenshot({
      path: join(shotDir, 'mobile-drawer-open.png'),
      fullPage: false,
    });

    // Close via backdrop
    if (await page.locator('.nav-backdrop').isVisible()) {
      await page.locator('.nav-backdrop').click({ position: { x: 300, y: 200 } });
      await page.waitForTimeout(200);
    }
    const closedClass = await page.locator('.shell').getAttribute('class');
    report.mobile.closesOnBackdrop = !(closedClass || '').includes('nav-open');

    // Export visible on Site Measure above fold
    const exportLabels = await page.locator('.export-group-label').allTextContents();
    report.exports.siteMeasureLabels = exportLabels.map((s) => s.trim());
    report.exports.siteMeasureVisible = exportLabels.some((s) => /Export Quote/i.test(s))
      && exportLabels.some((s) => /Export BOM/i.test(s));
    const exportBox = await page.locator('.export-toolbar').first().boundingBox();
    report.exports.siteMeasureAboveFold =
      !!exportBox && exportBox.y >= 0 && exportBox.y < 844;

    await page.screenshot({
      path: join(shotDir, 'mobile-site-measure-export.png'),
      fullPage: false,
    });
    await page.close();
  }

  // —— Desktop: independent scroll + export ——
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
    await page.waitForSelector('.export-toolbar');

    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('.shell');
      const sidebar = document.querySelector('.sidebar');
      const main = document.querySelector('.main');
      const shellStyle = getComputedStyle(shell);
      const sideStyle = getComputedStyle(sidebar);
      const mainStyle = getComputedStyle(main);
      // Force main content tall enough to scroll
      const pad = document.createElement('div');
      pad.style.height = '2000px';
      pad.id = 'wd16-scroll-pad';
      main.appendChild(pad);
      const beforeMain = main.scrollTop;
      main.scrollTop = 600;
      const afterMain = main.scrollTop;
      const sideBefore = sidebar.scrollTop;
      // Sidebar should not move when main scrolls
      const sideAfterMainScroll = sidebar.scrollTop;
      main.scrollTop = 0;
      pad.remove();
      return {
        shellHeight: shellStyle.height,
        shellOverflow: shellStyle.overflow,
        sideOverflowY: sideStyle.overflowY,
        mainOverflowY: mainStyle.overflowY,
        mainScrolled: afterMain > beforeMain + 100,
        sidebarUnmoved: sideBefore === sideAfterMainScroll,
        toggleHidden: getComputedStyle(document.querySelector('.mobile-nav-toggle')).display === 'none',
      };
    });
    report.desktop = metrics;

    const labels = await page.locator('.export-group-label').allTextContents();
    report.exports.desktopSiteMeasure = labels.map((s) => s.trim());

    await page.screenshot({
      path: join(shotDir, 'desktop-site-measure.png'),
      fullPage: false,
    });

    // Scroll main and capture — sidebar brand still in viewport of shell
    await page.evaluate(() => {
      document.querySelector('.main').scrollTop = 400;
    });
    await page.waitForTimeout(150);
    await page.screenshot({
      path: join(shotDir, 'desktop-main-scrolled.png'),
      fullPage: false,
    });
    const brandVisible = await page.locator('.sidebar .brand strong').isVisible();
    report.desktop.brandStillVisibleAfterMainScroll = brandVisible;

    await page.goto(base + '/configure', { waitUntil: 'networkidle' });
    await page.waitForSelector('.export-toolbar');
    const cfgLabels = await page.locator('.export-group-label').allTextContents();
    report.exports.configurator = cfgLabels.map((s) => s.trim());
    const cfgBox = await page.locator('.export-toolbar').first().boundingBox();
    report.exports.configuratorAboveFold = !!cfgBox && cfgBox.y < 500;
    await page.screenshot({
      path: join(shotDir, 'desktop-configurator-export.png'),
      fullPage: false,
    });

    await page.goto(base + '/quote', { waitUntil: 'networkidle' });
    await page.waitForSelector('.export-toolbar');
    report.exports.quotation = await page.locator('.export-group-label').allTextContents();
    await page.close();
  }

  await browser.close();
  if (server) await server.close();

  const ok =
    report.mobile.defaultCollapsed &&
    report.mobile.opensDrawer &&
    report.mobile.closesOnBackdrop &&
    report.exports.siteMeasureVisible &&
    report.exports.siteMeasureAboveFold &&
    report.desktop.mainScrolled &&
    report.desktop.sidebarUnmoved &&
    report.desktop.brandStillVisibleAfterMainScroll &&
    report.desktop.toggleHidden &&
    report.exports.configuratorAboveFold &&
    report.exports.configurator.some((s) => /Export Quote/i.test(s));

  report.ok = ok;
  writeFileSync(join(shotDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));

  if (existsSync(mediaDir)) {
    const pairs = [
      ['mobile-drawer-open.png', 'toolkit-shell-mobile-drawer.png'],
      ['desktop-site-measure.png', 'toolkit-export-site-measure.png'],
      ['desktop-main-scrolled.png', 'toolkit-shell-desktop-scroll.png'],
      ['desktop-configurator-export.png', 'toolkit-export-configurator.png'],
      ['mobile-site-measure-export.png', 'toolkit-shell-mobile-export.png'],
    ];
    for (const [src, dest] of pairs) {
      const from = join(shotDir, src);
      if (existsSync(from)) copyFileSync(from, join(mediaDir, dest));
    }
    writeFileSync(join(mediaDir, 'toolkit-shell-export-wd16.json'), JSON.stringify(report, null, 2));
  }

  if (!ok) {
    console.error('WD-16 smoke FAILED');
    process.exit(1);
  }
  console.log('WD-16 smoke OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
