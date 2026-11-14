import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('http://127.0.0.1:5173/site-measure', { waitUntil: 'networkidle' });
const send = page.locator('.site-measure-desktop-chrome [data-testid="site-measure-send-openings"]');
await send.waitFor({ state: 'visible', timeout: 15000 });
const labels = await send.locator('.site-measure-send-btn-label').allTextContents();
await send.getByTestId('send-openings-quote').click();
await send.locator('[data-testid="site-measure-send-status"]').waitFor({ state: 'visible' });
const status = await send.locator('[data-testid="site-measure-send-status"]').innerText();
console.log(JSON.stringify({ labels, status }, null, 2));
await browser.close();
