/**
 * Site Measure “Send openings to…” — labels, net fab sizes, destination sheets.
 * Run: node tools/_smoke-site-measure-send-openings.mjs
 */
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'tools', '_smoke-site-measure-send-shots');
mkdirSync(outDir, { recursive: true });

async function readLocalState(page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('wd-toolkit-v7');
    return raw ? JSON.parse(raw) : null;
  });
}

async function waitState(page, pred, label, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await readLocalState(page);
    if (s && pred(s)) return s;
    await page.waitForTimeout(120);
  }
  throw new Error(`Timed out waiting for state: ${label}`);
}

function netOf(state, line) {
  const material = state.projects?.find((p) => p.id === state.activeProjectId)?.material ?? 'UPVC';
  const lessW =
    line.lessOffWidthMm ??
    state.projects?.find((p) => p.id === state.activeProjectId)?.lessOffWidthMm ??
    (material === 'Aluminium' ? state.allowances.lessOffAluWidthMm : state.allowances.lessOffWidthMm) ??
    0;
  const lessH =
    line.lessOffHeightMm ??
    state.projects?.find((p) => p.id === state.activeProjectId)?.lessOffHeightMm ??
    (material === 'Aluminium' ? state.allowances.lessOffAluHeightMm : state.allowances.lessOffHeightMm) ??
    0;
  return {
    w: Math.max(0, line.width - lessW),
    h: Math.max(0, line.height - lessH),
    lessW,
    lessH,
  };
}

async function main() {
  const server = await createServer({
    root,
    server: { port: 5203, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  const base = 'http://127.0.0.1:5203';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const report = { base, checks: {}, ok: false };

  await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
  const send = page.locator('.site-measure-desktop-chrome [data-testid="site-measure-send-openings"]');
  await send.waitFor({ state: 'visible', timeout: 20000 });
  const labels = await send.locator('.site-measure-send-btn-label').allTextContents();
  report.checks.labels = labels;
  // UPVC shows primary "Generate full package" then the four individual sends.
  const expectedUpvc = 'Generate full package|Quote|Costing|Configurator|Cutting';
  const expectedAlu = 'Quote|Costing|Configurator|Cutting';
  if (labels.join('|') !== expectedUpvc && labels.join('|') !== expectedAlu) {
    throw new Error(`Unexpected labels: ${labels.join(', ')}`);
  }
  const help = await send.locator('.site-measure-send-help').innerText();
  if (!/Net fab size/i.test(help) || !/less-off/i.test(help)) {
    throw new Error('Helper text missing net fab / less-off explanation');
  }
  const fullPkg = send.getByTestId('send-openings-full-package');
  report.checks.hasFullPackage = (await fullPkg.count()) > 0;

  // Capture baseline site vs net from first opening row
  const before = await readLocalState(page);
  if (!before?.siteMeasures?.length) throw new Error('Seed siteMeasures missing');
  const first = before.siteMeasures[0];
  const firstNet = netOf(before, first);
  report.checks.siteSize = { w: first.width, h: first.height };
  report.checks.lessOff = { w: firstNet.lessW, h: firstNet.lessH };
  report.checks.expectNet = { w: firstNet.w, h: firstNet.h };

  // UPVC full package (primary) — materials + glass + mesh + quote header
  if (report.checks.hasFullPackage) {
    await fullPkg.click();
    const statusEl = send.locator('[data-testid="site-measure-send-status"]');
    await statusEl.waitFor({ state: 'visible', timeout: 15000 });
    const statusText = await statusEl.innerText();
    report.checks.fullPackageStatus = statusText.slice(0, 240);
    if (!/UPVC package/i.test(statusText)) {
      throw new Error(`Full package status unexpected: ${statusText}`);
    }
    const afterPkg = await waitState(
      page,
      (s) => (s.cuts?.length ?? 0) >= 10 && (s.glassPanes?.length ?? 0) >= 1,
      'upvc full package storage',
      15000,
    );
    report.checks.fullPackage = {
      openings: afterPkg.openings.length,
      cuts: afterPkg.cuts.length,
      glass: afterPkg.glassPanes.length,
      mesh: afterPkg.meshGrill.length,
      quoteCustomer: afterPkg.quote.customerName,
      quoteDate: afterPkg.quote.quoteDate,
    };
    const remnants = page.locator('[data-testid="upvc-package-remnants"]');
    report.checks.remnantUiVisible = (await remnants.count()) > 0;
  }

  // Quote → openings use net fab (scope clicks to visible desktop send panel)
  await send.getByTestId('send-openings-quote').click();
  await send.locator('[data-testid="site-measure-send-status"]').waitFor({ state: 'visible' });
  const afterQuote = await waitState(
    page,
    (s) => s.openings?.length === before.siteMeasures.length && s.openings[0]?.width === firstNet.w,
    'quote openings net',
  );
  const o0 = afterQuote.openings[0];
  report.checks.quoteOpening = { w: o0.width, h: o0.height, n: afterQuote.openings.length };
  if (o0.width !== firstNet.w || o0.height !== firstNet.h) {
    throw new Error(
      `Quote openings not net: got ${o0.width}×${o0.height}, expected ${firstNet.w}×${firstNet.h}`,
    );
  }

  // Costing → sliding/casement jobs use net of matching lines
  const slidingLine = before.siteMeasures.find((m) => {
    const wt = before.windowTypes.find((t) => t.id === m.windowTypeId);
    return wt?.kind === 'sliding' || (m.tracks ?? 0) > 0;
  });
  const casementLine = before.siteMeasures.find((m) => {
    const wt = before.windowTypes.find((t) => t.id === m.windowTypeId);
    return wt?.kind === 'casement' || wt?.kind === 'door';
  });
  await send.getByTestId('send-openings-costing').click();
  const afterCost = await waitState(
    page,
    (s) => {
      const slidOk = !slidingLine || s.sliding.widthMm === netOf(before, slidingLine).w;
      const caseOk = !casementLine || s.casement.widthMm === netOf(before, casementLine).w;
      return slidOk && caseOk;
    },
    'costing net sizes',
  );
  report.checks.costing = {
    sliding: { w: afterCost.sliding.widthMm, h: afterCost.sliding.heightMm },
    casement: { w: afterCost.casement.widthMm, h: afterCost.casement.heightMm },
  };

  // Configurator cart
  await send.getByTestId('send-openings-configurator').click();
  const afterCfg = await waitState(
    page,
    (s) =>
      s.configuratorLines?.length === before.siteMeasures.length &&
      s.configuratorLines[0]?.widthMm === firstNet.w,
    'configurator net',
  );
  const c0 = afterCfg.configuratorLines[0];
  report.checks.configurator = { w: c0.widthMm, h: c0.heightMm, n: afterCfg.configuratorLines.length };
  if (c0.widthMm !== firstNet.w || c0.heightMm !== firstNet.h) {
    throw new Error(`Configurator not net: ${c0.widthMm}×${c0.heightMm}`);
  }

  // Cutting cut list
  await send.getByTestId('send-openings-cutting').click();
  const afterCut = await waitState(
    page,
    (s) => s.cuts?.some((c) => c.cutMm === firstNet.w) && s.cuts?.some((c) => c.cutMm === firstNet.h),
    'cutting net cuts',
  );
  const cutWs = afterCut.cuts.filter((c) => c.cutMm === firstNet.w);
  const cutHs = afterCut.cuts.filter((c) => c.cutMm === firstNet.h);
  report.checks.cutting = {
    total: afterCut.cuts.length,
    netWCuts: cutWs.length,
    netHCuts: cutHs.length,
  };
  if (!cutWs.length || !cutHs.length) {
    throw new Error('Cutting list missing net W/H frame cuts');
  }

  // Follow status link to Quote openings path if Vendor — else quotation
  const statusLink = send.locator('[data-testid="site-measure-send-status"] a').first();
  if (await statusLink.count()) {
    await statusLink.click();
    await page.waitForTimeout(400);
    report.checks.statusNav = page.url();
  }

  await page.goto(base + '/site-measure', { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(outDir, 'send-openings-desktop.png') });

  report.ok = true;
  writeFileSync(join(outDir, 'send-openings-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.log('Site Measure send openings smoke OK');

  await browser.close();
  await server.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
