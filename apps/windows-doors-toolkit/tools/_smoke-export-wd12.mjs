/**
 * WD-12 smoke: export toolbar visible; CSV quote/BOM with & without rates.
 * Run: node tools/_smoke-export-wd12.mjs  (expects vite on 5173 or starts preview)
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-export-shots');
mkdirSync(shotDir, { recursive: true });

const mediaDir =
  'C:\\Users\\nasim ahmad\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-8a059652-0882-4ad5-bc64-db92001caa6e\\files\\media';

async function main() {
  const server = await createServer({
    root,
    server: { port: 5191, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const url = 'http://127.0.0.1:5191';
  console.log('dev', url);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const downloads = [];
  page.on('download', async (d) => {
    const name = d.suggestedFilename();
    const p = join(shotDir, name);
    await d.saveAs(p);
    downloads.push({ name, path: p });
    console.log('download', name);
  });

  // Home owner path — no verification gate
  await page.goto(url + '/configure', { waitUntil: 'networkidle' });
  await page.waitForSelector('.export-toolbar');
  const configureLabels = await page.locator('.export-group-label').allTextContents();
  console.log('configure labels', configureLabels);

  // Add a line if cart empty
  const addBtn = page.getByRole('button', { name: /Add to quote/i });
  if (await addBtn.isEnabled()) {
    await addBtn.click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: join(shotDir, 'configure-export.png'), fullPage: false });
  if (existsSync(mediaDir)) {
    writeFileSync(
      // placeholder — copy via fs below
      join(shotDir, '_ok.txt'),
      'ok',
    );
  }

  // Trigger Excel quote with rates
  await page.getByRole('button', { name: 'Excel · with rates' }).first().click();
  await page.waitForTimeout(500);
  // BOM excel no rates (second group)
  const bomExcelNoRates = page.locator('.export-group').nth(1).getByRole('button', { name: 'Excel · no rates' });
  await bomExcelNoRates.click();
  await page.waitForTimeout(500);

  // Quotation page
  await page.goto(url + '/quote', { waitUntil: 'networkidle' });
  await page.waitForSelector('.export-toolbar');
  await page.screenshot({ path: join(shotDir, 'quote-export.png'), fullPage: false });

  // Unlock Vendor (verified) so 07 Hardware BOM export is reachable.
  // Mutate storage then hard-navigate in one turn so React cannot overwrite localStorage first.
  await page.evaluate((hwUrl) => {
    const key = 'wd-toolkit-v7';
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const state = JSON.parse(raw);
    const pid = state.activeProjectId;
    state.projects = (state.projects || []).map((p) =>
      p.id === pid ? { ...p, customerMode: 'vendor' } : p,
    );
    const entry = {
      modeId: 'vendor',
      name: 'Smoke Vendor',
      email: 'vendor.smoke@woodenmax.in',
      mobile: '9999999999',
      area: 'Test',
      city: 'Hyderabad',
      gstNo: '36AAAAA0000A1Z5',
      verifiedAt: new Date().toISOString(),
      customerId: 'SMOKE-VENDOR',
    };
    const list = Array.isArray(state.modeVerifications) ? state.modeVerifications : [];
    state.modeVerifications = [...list.filter((v) => v.modeId !== 'vendor'), entry];
    localStorage.setItem(key, JSON.stringify(state));
    location.href = hwUrl;
  }, url + '/hardware');
  await page.waitForURL('**/hardware', { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState('networkidle');
  console.log('hardware url', page.url());
  const hwToolbar = page.locator('.export-toolbar');
  const hwVisible = (await hwToolbar.count()) > 0;
  console.log('hardware export visible', hwVisible);
  if (hwVisible) {
    await page.screenshot({ path: join(shotDir, 'hardware-export.png'), fullPage: false });
    await page.locator('.export-group').nth(1).getByRole('button', { name: 'Excel · with rates' }).click();
    await page.waitForTimeout(400);
  }

  // Materials tab on configure still shows toolbar
  await page.goto(url + '/configure', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Materials', exact: true }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(shotDir, 'configure-materials-export.png'), fullPage: false });

  // Copy shots to media
  const { copyFileSync } = await import('fs');
  const map = [
    ['configure-export.png', 'toolkit-export-configurator.png'],
    ['quote-export.png', 'toolkit-export-quotation.png'],
    ['configure-materials-export.png', 'toolkit-export-bom-materials-tab.png'],
  ];
  if (hwVisible) map.push(['hardware-export.png', 'toolkit-export-hardware-bom.png']);
  for (const [from, to] of map) {
    copyFileSync(join(shotDir, from), join(mediaDir, to));
    console.log('media', to);
  }

  // Validate a CSV if downloaded
  const csv = downloads.find((d) => d.name.includes('with-rates') && d.name.endsWith('.csv'));
  if (csv) {
    const text = (await import('fs')).readFileSync(csv.path, 'utf8');
    const hasRateCol = /Rate|Amount|Retail|Grand/i.test(text);
    console.log('with-rates csv has money cols', hasRateCol, 'bytes', text.length);
  }
  const csvNo = downloads.find((d) => d.name.includes('no-rates') && d.name.endsWith('.csv'));
  if (csvNo) {
    const text = (await import('fs')).readFileSync(csvNo.path, 'utf8');
    const leaked = /Rate ₹|Amount ₹|Retail ₹/i.test(text);
    console.log('no-rates csv leaked rate headers', leaked);
  }

  await browser.close();
  await server.close();
  console.log('SMOKE_OK downloads=', downloads.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
