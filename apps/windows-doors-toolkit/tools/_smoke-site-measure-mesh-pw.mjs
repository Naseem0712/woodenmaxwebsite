import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const mediaDir =
  'C:/Users/nasim ahmad/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-8a059652-0882-4ad5-bc64-db92001caa6e/files/media';
mkdirSync(mediaDir, { recursive: true });
mkdirSync('D:/Downloads/Windows-Doors-Toolkit/tools', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = { errors: [] };
page.on('pageerror', (e) => results.errors.push(String(e)));
page.on('console', (msg) => {
  if (msg.type() === 'error') results.errors.push(msg.text());
});

await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
results.pathInitial = page.url();

await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith('wd-toolkit')) localStorage.removeItem(k);
  }
});
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
results.path = page.url();
results.landing = /site-measure/.test(results.path);

const headers = await page.locator('table.data thead th').allTextContents();
results.headers = headers;
results.hasGlassDoorsCol = headers.some((h) => /glass doors/i.test(h));
results.hasMeshDoorsCol = headers.some((h) => /mesh doors/i.test(h));
results.hasMeshTypeCol = headers.some((h) => /mesh type/i.test(h));
results.hasTracksCol = headers.some((h) => /tracks/i.test(h));

const rows = page.locator('table.data tbody tr');
const count = await rows.count();
results.rowCount = count;
let livingIdx = -1;
for (let i = 0; i < count; i++) {
  const inputs = rows.nth(i).locator('td input[placeholder], td input:not([type=date])');
  // location is typically the third text input area — scan all inputs for Living
  const vals = await rows.nth(i).locator('td input').evaluateAll((els) => els.map((e) => e.value));
  if (vals.some((v) => /living/i.test(v || ''))) {
    livingIdx = i;
    break;
  }
}
results.livingIdx = livingIdx;

if (livingIdx >= 0) {
  const row = rows.nth(livingIdx);
  const tds = row.locator('td');
  // Tracks ≈ index 12
  const trackInput = tds.nth(12).locator('input').first();
  if (await trackInput.count()) {
    await trackInput.fill('3');
    await trackInput.blur();
    await page.waitForTimeout(250);
  }
  const meshDoorsInput = tds.nth(14).locator('input').first();
  if (await meshDoorsInput.count()) {
    await meshDoorsInput.fill('1');
    await meshDoorsInput.blur();
  }
  const meshTypeSelect = tds.nth(15).locator('select').first();
  if (await meshTypeSelect.count()) {
    await meshTypeSelect.selectOption('rolling');
  }
  results.living = {
    tracks: await trackInput.inputValue().catch(() => null),
    glassDoors: await tds.nth(13).locator('input').first().inputValue().catch(() => null),
    meshDoors: await meshDoorsInput.inputValue().catch(() => null),
    meshType: await meshTypeSelect.inputValue().catch(() => null),
  };
}

const landingShot = `${mediaDir}/toolkit-site-measure-landing-mesh.png`;
await page.screenshot({ path: landingShot, fullPage: true });
await page.screenshot({
  path: 'D:/Downloads/Windows-Doors-Toolkit/tools/_smoke-site-measure-landing.png',
  fullPage: true,
});
results.landingShot = landingShot;

const push = page.getByTestId('send-openings-costing');
if (await push.count()) {
  await push.click();
  await page.waitForTimeout(400);
  results.pushedCosting = true;
}

await page.goto('http://127.0.0.1:5173/sliding', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const slidingText = await page.locator('main').innerText();
results.slidingHasMeshDoors = /Mesh doors/i.test(slidingText);
results.slidingHasMeshType = /Mesh type/i.test(slidingText);
results.slidingTracks = await page.locator('main').innerText().then((t) => {
  const m = t.match(/Tracks[\s\S]{0,80}?(\d+(?:\.\d+)?)/i);
  return m?.[1] ?? null;
});
const slidingShot = `${mediaDir}/toolkit-sliding-3track-mesh.png`;
await page.screenshot({ path: slidingShot, fullPage: true });
await page.screenshot({
  path: 'D:/Downloads/Windows-Doors-Toolkit/tools/_smoke-sliding-mesh.png',
  fullPage: true,
});
results.slidingShot = slidingShot;

await page.goto('http://127.0.0.1:5173/settings/allowances', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const allowText = await page.locator('main').innerText();
results.allowancesHasMeshCard = /Door \/ mesh costing defaults/i.test(allowText);
const allowShot = `${mediaDir}/toolkit-settings-mesh-defaults.png`;
await page.screenshot({ path: allowShot, fullPage: true });
results.allowShot = allowShot;

results.ok =
  results.landing &&
  results.hasGlassDoorsCol &&
  results.hasMeshDoorsCol &&
  results.hasMeshTypeCol &&
  results.slidingHasMeshDoors &&
  results.allowancesHasMeshCard &&
  results.errors.filter((e) => !/favicon/i.test(e)).length === 0;

console.log(JSON.stringify(results, null, 2));
await browser.close();
process.exit(results.ok ? 0 : 1);
