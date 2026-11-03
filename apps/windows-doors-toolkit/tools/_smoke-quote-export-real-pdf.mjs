/**
 * WD-28 smoke: cleaned quote letterhead, fixed quote series, brands on W-xx lines,
 * real .pdf + .csv downloads (never .html pretending to be PDF).
 * Run: npx vite-node tools/_smoke-quote-export-real-pdf.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import {
  mkdirSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  readFileSync,
} from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createSeedState } from '../src/data/seed.ts';
import {
  ensureQuoteNumbered,
  allocateQuoteNo,
  peekNextQuoteNo,
} from '../src/engine/quoteSeries.ts';
import {
  buildSiteMeasureQuoteDocument,
  documentToHtml,
} from '../src/engine/exportDocs.ts';
import { buildPdfBytes } from '../src/engine/exportPdf.ts';
import {
  formatGlassLabel,
  formatWindowTypeLabel,
  formatMeshSpecLine,
} from '../src/engine/quoteOpeningFormat.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const shotDir = join(root, 'tools', '_smoke-quote-export-wd28');
mkdirSync(shotDir, { recursive: true });

const mediaDir =
  'C:\\Users\\nasim ahmad\\AppData\\Local\\Cursor\\AgentStores\\cursor_agent_stores\\bc-8a059652-0882-4ad5-bc64-db92001caa6e\\files\\media';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function isPdf(buf) {
  return buf.length > 5 && buf.slice(0, 5).toString('utf8') === '%PDF-';
}

async function main() {

  const seed = createSeedState();
  assert(seed.business.quoteSeriesPrefix === 'Q-2026', 'seed series prefix');
  assert(seed.business.quoteNextSeq === 2, 'seed next seq after 001');
  assert(peekNextQuoteNo(seed.business) === 'Q-2026-002', 'peek next');

  const a1 = allocateQuoteNo(seed.business);
  assert(a1.quoteNo === 'Q-2026-002', `alloc 002 got ${a1.quoteNo}`);
  const a2 = allocateQuoteNo(a1.business);
  assert(a2.quoteNo === 'Q-2026-003', `alloc 003 got ${a2.quoteNo}`);
  assert(a2.business.quoteSeriesPrefix === 'Q-2026', 'prefix stays fixed');

  const keep = ensureQuoteNumbered(a2.business, 'Q-2026-001');
  assert(keep.quoteNo === 'Q-2026-001' && !keep.allocated, 'existing quoteNo not reinvented');
  assert(keep.business.quoteNextSeq === a2.business.quoteNextSeq, 'seq unchanged when kept');

  // Glass thickness not doubled when name already has mm
  assert(
    formatGlassLabel({ name: 'Clear 5 mm', thicknessMm: 5, brand: 'Saint-Gobain' }) ===
      'Clear 5 mm (Saint-Gobain)',
    'glass no double thickness',
  );
  assert(
    formatWindowTypeLabel('Aluminium 2-track sliding', 'Jindal').includes('Jindal'),
    'window brand',
  );
  assert(formatMeshSpecLine('rolling', 0.5, 'Black', 'Phifer').includes('Phifer'), 'mesh brand');

  // Build quote HTML letterhead — no banned badges
  const siteDoc = buildSiteMeasureQuoteDocument(seed, 'include');
  const html = documentToHtml(siteDoc);
  writeFileSync(join(shotDir, 'quote-letterhead-preview.html'), html, 'utf8');
  for (const bad of [
    'Site measure quote',
    'Package amounts',
    'Measured openings',
    'Mode Vendor',
    'Mode Home',
    'Mode quote',
  ]) {
    assert(!html.includes(bad), `letterhead must not contain: ${bad}`);
  }
  assert(html.includes('Quotation'), 'title Quotation');
  assert(/Q-2026-001/.test(html) || html.includes(seed.quote.quoteNo), 'quote no present');

  // Brands on opening blocks
  const blockText = (siteDoc.openingBlocks || []).map((b) => b.text).join('\n');
  writeFileSync(join(shotDir, 'opening-blocks.txt'), blockText, 'utf8');
  if (siteDoc.openingBlocks?.length) {
    assert(/Window:/.test(blockText), 'Window line');
    // Seed Alu series brand Jindal / UPVC Fenesta / glass Saint-Gobain / mesh Phifer when mesh present
    const hasBrand =
      /Jindal|Fenesta|Saint-Gobain|Metro|Phifer/i.test(blockText);
    assert(hasBrand, `expected brands in blocks:\n${blockText.slice(0, 800)}`);
  }

  // Real PDF bytes
  const pdfBytes = await buildPdfBytes(siteDoc);
  assert(isPdf(Buffer.from(pdfBytes)), 'PDF magic %PDF-');
  writeFileSync(join(shotDir, 'quote-package.pdf'), Buffer.from(pdfBytes));
  console.log('unit ok — series, letterhead, brands, pdf bytes', pdfBytes.byteLength);

  // Browser: download real PDF + CSV
  const server = await createServer({
    root,
    server: { port: 5218, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const url = 'http://127.0.0.1:5218';
  console.log('dev', url);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const downloads = [];
  page.on('download', async (d) => {
    const name = d.suggestedFilename();
    const p = join(shotDir, `dl-${name}`);
    await d.saveAs(p);
    downloads.push({ name, path: p });
    console.log('download', name);
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

  await page.goto(url + '/quote', { waitUntil: 'networkidle' });
  await page.waitForSelector('.export-toolbar, .quote-letterhead', { timeout: 20000 });

  // Screenshot cleaned on-screen header
  const letterhead = page.locator('.quote-letterhead').first();
  if ((await letterhead.count()) > 0) {
    await letterhead.screenshot({ path: join(shotDir, 'quote-header-clean.png') });
  }
  await page.screenshot({ path: join(shotDir, 'quote-page.png'), fullPage: false });

  const headerText = await page.locator('.quote-print').first().innerText().catch(() => '');
  for (const bad of ['Site measure quote', 'Package amounts', 'Mode:']) {
    assert(!headerText.includes(bad), `on-screen header has ${bad}`);
  }

  // PDF download (toolbar may appear twice — main + panel)
  const quotePdfBtn = page.getByTestId('export-toolbar').getByTestId('export-quote-pdf');
  const [pdfDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }),
    quotePdfBtn.click(),
  ]);
  {
    const name = pdfDownload.suggestedFilename();
    const p = join(shotDir, `dl-${name}`);
    await pdfDownload.saveAs(p);
    downloads.push({ name, path: p });
    console.log('download', name);
  }
  // Excel download
  const quoteExcelBtn = page.getByTestId('export-toolbar').getByTestId('export-quote-excel');
  const [csvDownload] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    quoteExcelBtn.click(),
  ]);
  {
    const name = csvDownload.suggestedFilename();
    const p = join(shotDir, `dl-${name}`);
    await csvDownload.saveAs(p);
    downloads.push({ name, path: p });
    console.log('download', name);
  }

  // Also Site Measure exports
  await page.goto(url + '/site-measure', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="export-toolbar"]', { timeout: 15000 }).catch(() => {});
  const smPdf = page.getByTestId('export-toolbar').getByTestId('export-quote-pdf');
  if ((await smPdf.count()) > 0) {
    await smPdf.click();
    await page.waitForTimeout(1200);
  }

  const pdfDl = downloads.find((d) => d.name.toLowerCase().endsWith('.pdf'));
  const csvDl = downloads.find((d) => d.name.toLowerCase().endsWith('.csv'));
  assert(pdfDl, `expected .pdf download, got: ${downloads.map((d) => d.name).join(', ')}`);
  assert(csvDl, `expected .csv download, got: ${downloads.map((d) => d.name).join(', ')}`);
  assert(!downloads.some((d) => d.name.toLowerCase().endsWith('.html')), 'no .html exports');

  const pdfBuf = readFileSync(pdfDl.path);
  assert(isPdf(pdfBuf), `downloaded file not PDF: ${pdfDl.name}`);

  // Settings quote series field
  await page.goto(url + '/settings/business', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="quote-series-prefix"]', { timeout: 10000 });
  const prefix = await page.getByTestId('quote-series-prefix').inputValue();
  assert(prefix === 'Q-2026', `settings prefix ${prefix}`);
  await page.screenshot({ path: join(shotDir, 'settings-quote-series.png'), fullPage: false });

  // Copy evidence to media
  if (existsSync(mediaDir)) {
    const pairs = [
      ['quote-header-clean.png', 'toolkit-quote-header-clean.png'],
      ['quote-package.pdf', 'toolkit-quote-real.pdf'],
      ['dl-' + pdfDl.name, 'toolkit-quote-download.pdf'],
      ['settings-quote-series.png', 'toolkit-quote-series-settings.png'],
      ['opening-blocks.txt', 'toolkit-quote-brands-blocks.txt'],
    ];
    for (const [from, to] of pairs) {
      const src = join(shotDir, from);
      if (existsSync(src)) copyFileSync(src, join(mediaDir, to));
    }
    // Also copy downloaded pdf under stable name if dl path differs
    copyFileSync(pdfDl.path, join(mediaDir, 'toolkit-quote-download.pdf'));
    writeFileSync(
      join(mediaDir, 'toolkit-quote-export-wd28.json'),
      JSON.stringify(
        {
          downloads: downloads.map((d) => d.name),
          pdfBytes: pdfBuf.length,
          pdfMagic: pdfBuf.slice(0, 5).toString('utf8'),
          seriesPrefix: prefix,
          nextPeek: peekNextQuoteNo(seed.business),
        },
        null,
        2,
      ),
      'utf8',
    );
  }

  await browser.close();
  await server.close();
  console.log('SMOKE OK', { downloads: downloads.map((d) => d.name), pdfBytes: pdfBuf.length });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
