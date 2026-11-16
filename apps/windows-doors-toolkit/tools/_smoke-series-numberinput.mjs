import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('console', (m) => console.log('CONSOLE', m.type(), m.text()));
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

await page.goto('http://127.0.0.1:5173/settings/series', {
  waitUntil: 'networkidle',
  timeout: 30000,
});
await page.waitForSelector('table.data tbody tr');

const before = await page.evaluate(() => {
  const row = document.querySelector('table.data tbody tr');
  const nums = [...row.querySelectorAll('input[data-numeric="1"]')].map((i) => i.value);
  return { nums };
});
console.log('BEFORE', JSON.stringify(before));

const firstNum = page.locator('table.data tbody tr').first().locator('input[data-numeric="1"]').first();
await firstNum.click({ clickCount: 3 });
await firstNum.fill('5');
await page.waitForTimeout(300);

const mid = await page.evaluate(() => {
  const row = document.querySelector('table.data tbody tr');
  return [...row.querySelectorAll('input[data-numeric="1"]')].map((i) => i.value);
});
console.log('AFTER_FILL', JSON.stringify(mid));

await firstNum.blur();
await page.waitForTimeout(300);

const after = await page.evaluate(() => {
  const row = document.querySelector('table.data tbody tr');
  return [...row.querySelectorAll('input[data-numeric="1"]')].map((i) => i.value);
});
console.log('AFTER_BLUR', JSON.stringify(after));

const second = page.locator('table.data tbody tr').first().locator('input[data-numeric="1"]').nth(1);
await second.click({ clickCount: 3 });
await page.keyboard.type('7');
await page.waitForTimeout(200);
console.log('TYPED_H', await second.inputValue());

// Simulate clear + type (common "not editable" complaint path)
await firstNum.click({ clickCount: 3 });
await page.keyboard.press('Backspace');
await page.waitForTimeout(100);
console.log('CLEARED', await firstNum.inputValue());
await page.keyboard.type('3');
await page.waitForTimeout(200);
console.log('RETYPED', await firstNum.inputValue());
await firstNum.blur();
await page.waitForTimeout(200);
console.log(
  'FINAL_ROW',
  await page.evaluate(() => {
    const row = document.querySelector('table.data tbody tr');
    return [...row.querySelectorAll('input[data-numeric="1"]')].map((i) => i.value);
  }),
);

await page.screenshot({
  path: 'C:/Users/nasim ahmad/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-8a059652-0882-4ad5-bc64-db92001caa6e/files/media/series-members-qty-test.png',
  fullPage: true,
});
await browser.close();
