export default async function (page, ui) {
  await page.goto('http://127.0.0.1:5173/settings/business', { waitUntil: 'networkidle' });
  await page.waitForSelector('h1');
  const nameInput = page.locator('label.field').filter({ hasText: 'Company name' }).locator('input');
  await nameInput.fill('Smoke Test Fabricators Pvt Ltd');
  await page.waitForTimeout(300);
  await page.goto('http://127.0.0.1:5173/settings/business', { waitUntil: 'networkidle' });
  const persisted = await nameInput.inputValue();
  await page.goto('http://127.0.0.1:5173/sliding', { waitUntil: 'networkidle' });
  const w = page.locator('label.field').filter({ hasText: 'Width W (mm)' }).locator('input');
  const h = page.locator('label.field').filter({ hasText: 'Height H (mm)' }).locator('input');
  await w.fill('1500');
  await h.fill('1200');
  await page.waitForTimeout(200);
  const total = await page.locator('.calc-box').filter({ hasText: 'Total all windows' }).locator('.calc-value').innerText();
  const series = await page.locator('label.field').filter({ hasText: 'Series' }).locator('select').inputValue();
  return { persisted, total, series, ok: persisted.includes('Smoke Test') };
}
