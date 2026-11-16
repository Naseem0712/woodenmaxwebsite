import { chromium } from 'playwright';

const mediaDir =
  'C:/Users/nasim ahmad/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-8a059652-0882-4ad5-bc64-db92001caa6e/files/media';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://127.0.0.1:5173/site-measure', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('wd-toolkit')) localStorage.removeItem(k);
  }
});
await page.goto('http://127.0.0.1:5173/site-measure', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Inject verified Vendor + switch active project mode via localStorage mutation
await page.evaluate(() => {
  const key = Object.keys(localStorage).find((k) => k.startsWith('wd-toolkit')) || 'wd-toolkit-v7';
  const raw = localStorage.getItem(key);
  if (!raw) return { ok: false, reason: 'no state' };
  const state = JSON.parse(raw);
  state.modeVerifications = [
    {
      modeId: 'vendor',
      name: 'Smoke Vendor',
      email: 'vendor@smoke-test.com',
      customerId: 'cust_smoke_vendor-smoke-test-com',
      mobile: '9999999999',
      area: 'Test Area',
      city: 'Hyderabad',
      gstNo: '29AAAAA0000A1Z5',
      verifiedAt: new Date().toISOString(),
    },
  ];
  state.projects = (state.projects || []).map((p) =>
    p.id === state.activeProjectId ? { ...p, customerMode: 'vendor' } : p,
  );
  localStorage.setItem(key, JSON.stringify(state));
  return { ok: true, key };
});

await page.goto('http://127.0.0.1:5173/site-measure', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

// Confirm vendor nav has Sliding
const navText = await page.locator('aside.sidebar').innerText();
const hasSlidingNav = /02 Sliding/i.test(navText);

// Ensure living room is 3-track + mesh, then push costing
const rows = page.locator('table.data tbody tr');
const count = await rows.count();
let livingIdx = 0;
for (let i = 0; i < count; i++) {
  const vals = await rows.nth(i).locator('td input').evaluateAll((els) => els.map((e) => e.value));
  if (vals.some((v) => /living/i.test(v || ''))) {
    livingIdx = i;
    break;
  }
}
const row = rows.nth(livingIdx);
const tds = row.locator('td');
await tds.nth(12).locator('input').first().fill('3');
await tds.nth(12).locator('input').first().blur();
await page.waitForTimeout(200);
await tds.nth(14).locator('input').first().fill('1');
await tds.nth(14).locator('input').first().blur();
await tds.nth(15).locator('select').first().selectOption('rolling');

await page.getByTestId('send-openings-costing').click();
await page.waitForTimeout(400);

await page.goto('http://127.0.0.1:5173/sliding', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const url = page.url();
const main = await page.locator('main').innerText();
const shot = `${mediaDir}/toolkit-sliding-3track-mesh.png`;
await page.screenshot({ path: shot, fullPage: true });
await page.screenshot({
  path: 'D:/Downloads/Windows-Doors-Toolkit/tools/_smoke-sliding-mesh.png',
  fullPage: true,
});

const out = {
  hasSlidingNav,
  url,
  stayedOnSliding: /\/sliding/.test(url),
  hasMeshDoors: /Mesh doors/i.test(main),
  hasMeshType: /Mesh type/i.test(main),
  hasGlassDoors: /Glass doors/i.test(main),
  tracksHint: /2 ≈ no mesh|Tracks/i.test(main),
  // Read yellow Tracks input value
  tracksValue: await page
    .locator('.card')
    .filter({ hasText: 'Configuration' })
    .locator('input[type=number]')
    .first()
    .inputValue()
    .catch(() => null),
  shot,
};
console.log(JSON.stringify(out, null, 2));
await browser.close();
process.exit(out.stayedOnSliding && out.hasMeshDoors ? 0 : 1);
