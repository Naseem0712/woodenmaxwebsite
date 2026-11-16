/**
 * Quick boot check: Site Measure must load without module SyntaxError.
 * Run: node tools/_verify-site-measure-boot.mjs
 */
import { chromium } from 'playwright';

const base = process.env.WD_BASE || 'http://127.0.0.1:5173';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errs.push(m.text());
});

await page.goto(`${base}/site-measure`, { waitUntil: 'networkidle', timeout: 60_000 });
await page.waitForTimeout(1200);
const hasToolbar = (await page.locator('[data-testid="export-toolbar"]').count()) > 0;
const bodyText = await page.locator('body').innerText();
const crash =
  /does not provide an export named|SyntaxError|buildHardwareProfileBoqDocument/i.test(
    bodyText + '\n' + errs.join('\n'),
  );

const report = {
  base,
  hasToolbar,
  crash,
  errs,
  ok: hasToolbar && !crash && errs.length === 0,
};
console.log(JSON.stringify(report, null, 2));
await browser.close();
process.exit(report.ok ? 0 : 1);
