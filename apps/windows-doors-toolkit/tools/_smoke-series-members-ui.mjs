import { chromium } from 'playwright';
import fs from 'fs';

const media =
  'C:/Users/nasim ahmad/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-8a059652-0882-4ad5-bc64-db92001caa6e/files/media';
fs.mkdirSync(media, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await page.goto('http://127.0.0.1:5173/settings/series', {
  waitUntil: 'networkidle',
  timeout: 30000,
});
await page.waitForSelector('table.data tbody tr');

const seriesSelect = page.locator('.toolbar select').first();

const factorV = page.locator('table.data tbody tr').first().locator('input[data-numeric="1"]').first();
await factorV.click({ clickCount: 3 });
await page.keyboard.press('Backspace');
await page.keyboard.type('5');
await factorV.blur();
await page.waitForTimeout(250);
const afterV = await factorV.inputValue();
console.log('factorV', afterV, afterV === '5' ? 'ok' : 'FAIL');

const trackSelect = page.locator('table.data tbody tr').first().locator('td').nth(2).locator('select');
const trackOptions = await trackSelect.locator('option').allTextContents();
console.log('trackOptions', trackOptions.join('|'));
console.log(trackOptions.includes('2.5-track') ? 'ok has-2.5-track' : 'FAIL missing-2.5-track');

const beforeCount = await seriesSelect.locator('option').count();
const beforeLabels = await seriesSelect.locator('option').allTextContents();
console.log('beforeSeries', beforeCount, beforeLabels);

await page.getByRole('button', { name: '+ New series' }).click();
await page.waitForTimeout(250);
const banner = await page.getByText('not saved yet').count();
console.log('unsavedBanner', banner > 0 ? 'ok' : 'FAIL');
const midLabels = await seriesSelect.locator('option').allTextContents();
const midCount = midLabels.length;
const hasUnsaved = midLabels.some((t) => /unsaved/i.test(t));
console.log('midSeries', midCount, hasUnsaved ? 'ok unsaved-option' : 'FAIL no-unsaved-option', midLabels);

await page.getByRole('button', { name: 'Discard' }).click();
await page.waitForTimeout(250);
const afterDiscardLabels = await seriesSelect.locator('option').allTextContents();
const afterDiscard = afterDiscardLabels.length;
const discardedClean = !afterDiscardLabels.some((t) => /unsaved/i.test(t)) && afterDiscard === beforeCount;
console.log('afterDiscard', afterDiscard, discardedClean ? 'ok save-gate-discard' : 'FAIL save-gate-discard');

await page.getByRole('button', { name: '+ New series' }).click();
await page.waitForTimeout(150);
await page.getByRole('button', { name: 'Save series' }).click();
await page.waitForTimeout(300);
const afterSaveLabels = await seriesSelect.locator('option').allTextContents();
const afterSave = afterSaveLabels.length;
const savedOk = afterSave === beforeCount + 1 && !afterSaveLabels.some((t) => /unsaved/i.test(t));
console.log('afterSave', afterSave, savedOk ? 'ok saved' : 'FAIL save', afterSaveLabels);

await page.screenshot({
  path: `${media}/series-members-ux-after.png`,
  fullPage: true,
});
await browser.close();

if (afterV !== '5' || !trackOptions.includes('2.5-track') || !discardedClean || !savedOk) {
  process.exit(1);
}
