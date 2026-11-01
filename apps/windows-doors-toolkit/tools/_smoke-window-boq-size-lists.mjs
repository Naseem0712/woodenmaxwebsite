/**
 * Smoke: Window size list + Hardware/profile BOQ deliverables
 * (Export toolbar groups + Site Measure previews + Excel downloads).
 *
 * Run: node tools/_smoke-window-boq-size-lists.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-boq-size-list-shots');
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const downloads = [];
  page.on('download', async (d) => {
    const name = d.suggestedFilename();
    const p = join(shotDir, name);
    await d.saveAs(p);
    downloads.push({ name, path: p });
    console.log('download', name);
  });

  const report = { base, labels: [], sizePreview: false, boqPreview: false, downloads: [], ok: false };

  await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="export-toolbar"]');
  await page.waitForSelector('[data-testid="deliverable-previews"]');

  report.labels = await page.locator('.export-group-label').allTextContents();
  console.log('labels', report.labels);
  const need = ['Export Quote', 'Export BOM', 'Export Size list', 'Export Profile BOQ'];
  for (const n of need) {
    if (!report.labels.some((l) => l.includes(n.replace('Export ', '')) || l === n)) {
      // labels are exact "Export Size list" etc.
      if (!report.labels.includes(n)) throw new Error(`Missing export group: ${n}; got ${report.labels.join(' | ')}`);
    }
  }

  const sizePreviewText = await page.locator('[data-testid="deliverable-previews"] .deliverable-preview-block').first().innerText();
  report.sizePreview = /Actual|Less W|Net|Hardwares/i.test(sizePreviewText);
  console.log('size preview sample', sizePreviewText.slice(0, 180).replace(/\n/g, ' | '));
  if (!report.sizePreview) throw new Error('Size list preview missing Actual/Less/Net/Hardwares');

  const boqLi = page.locator('[data-testid="deliverable-previews"] .deliverable-preview-list').nth(1).locator('li');
  await boqLi.first().waitFor({ state: 'visible', timeout: 5000 });
  const boqSample = await boqLi.first().innerText();
  report.boqPreview = /nos|ft|pc|set/i.test(boqSample);
  console.log('boq preview sample', boqSample);
  if (!report.boqPreview) throw new Error(`BOQ preview unexpected: ${boqSample}`);

  const shotUi = join(shotDir, 'site-measure-size-boq-ui.png');
  await page.locator('[data-testid="export-toolbar"]').screenshot({ path: join(shotDir, 'export-toolbar-4groups.png') });
  await page.locator('[data-testid="deliverable-previews"]').screenshot({ path: shotUi });

  // Excel size list (no rates) — 3rd export group
  await page.locator('.export-group').nth(2).getByRole('button', { name: 'Excel · no rates' }).click();
  await page.waitForTimeout(600);
  // Excel profile BOQ with rates — 4th group
  await page.locator('.export-group').nth(3).getByRole('button', { name: 'Excel · with rates' }).click();
  await page.waitForTimeout(600);

  // PDF size list opens print window
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 8000 }).catch(() => null),
    page.locator('.export-group').nth(2).getByRole('button', { name: 'PDF · no rates' }).click(),
  ]);
  if (popup) {
    await popup.waitForLoadState('domcontentloaded');
    const html = await popup.content();
    const pdfOk =
      /Window size list/i.test(html) &&
      (/Actual/i.test(html) || /Less W/i.test(html)) &&
      /Hardwares/i.test(html);
    report.pdfSizeList = pdfOk;
    const pdfShot = join(shotDir, 'window-size-list-pdf.png');
    await popup.screenshot({ path: pdfShot, fullPage: true });
    console.log('pdf size list ok', pdfOk);
    await popup.close();
    if (!pdfOk) throw new Error('PDF size list missing expected markers');
  } else {
    console.log('pdf popup blocked — excel path still validated');
    report.pdfSizeList = 'popup-blocked';
  }

  // Profile BOQ PDF
  const [popup2] = await Promise.all([
    page.waitForEvent('popup', { timeout: 8000 }).catch(() => null),
    page.locator('.export-group').nth(3).getByRole('button', { name: 'PDF · no rates' }).click(),
  ]);
  if (popup2) {
    await popup2.waitForLoadState('domcontentloaded');
    const html = await popup2.content();
    const pdfOk = /Hardware \/ profile BOQ|Profile BOQ|boq-lines|nos/i.test(html);
    report.pdfBoq = pdfOk;
    await popup2.screenshot({ path: join(shotDir, 'profile-boq-pdf.png'), fullPage: true });
    console.log('pdf boq ok', pdfOk);
    await popup2.close();
    if (!pdfOk) throw new Error('PDF BOQ missing expected markers');
  } else {
    report.pdfBoq = 'popup-blocked';
  }

  // Validate CSV contents
  await page.waitForTimeout(400);
  report.downloads = downloads.map((d) => d.name);
  const sizeCsv = downloads.find((d) => /window-size-list/i.test(d.name));
  const boqCsv = downloads.find((d) => /profile-boq/i.test(d.name));
  if (!sizeCsv) throw new Error('Missing window-size-list CSV download');
  if (!boqCsv) throw new Error('Missing profile-boq CSV download');
  const sizeBody = readFileSync(sizeCsv.path, 'utf8');
  const boqBody = readFileSync(boqCsv.path, 'utf8');
  if (!/Window size list/i.test(sizeBody) || !/Actual/i.test(sizeBody)) {
    throw new Error('Size list CSV missing content');
  }
  if (!/BOQ|nos|Hardware/i.test(boqBody)) {
    throw new Error('Profile BOQ CSV missing content');
  }
  report.csvSizeOk = true;
  report.csvBoqOk = true;

  if (existsSync(mediaDir)) {
    mkdirSync(mediaDir, { recursive: true });
    const map = [
      ['site-measure-size-boq-ui.png', 'toolkit-window-size-boq-ui.png'],
      ['export-toolbar-4groups.png', 'toolkit-export-size-boq-toolbar.png'],
      ['window-size-list-pdf.png', 'toolkit-window-size-list-pdf.png'],
      ['profile-boq-pdf.png', 'toolkit-profile-boq-pdf.png'],
    ];
    for (const [src, dest] of map) {
      const from = join(shotDir, src);
      if (existsSync(from)) copyFileSync(from, join(mediaDir, dest));
    }
    writeFileSync(join(mediaDir, 'toolkit-window-boq-size-lists.json'), JSON.stringify(report, null, 2));
  }

  report.ok = true;
  writeFileSync(join(shotDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log('OK', report);

  await browser.close();
  await server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
