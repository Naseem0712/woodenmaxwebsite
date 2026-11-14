/** Smoke: Mode switch re-renders sidebar + home hub without page refresh. */
export default async function (page) {
  const media =
    'C:/Users/nasim ahmad/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-8a059652-0882-4ad5-bc64-db92001caa6e/files/media';

  await page.goto('http://127.0.0.1:5173/settings/data', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  page.once('dialog', (d) => d.accept());
  const resetBtn = page.getByRole('button', { name: /Reset to seed/i });
  if (await resetBtn.count()) {
    await resetBtn.click();
    await page.waitForTimeout(500);
  }

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.sidebar');
  await page.waitForTimeout(300);

  const modeSel = page
    .locator('.project-switcher-label')
    .filter({ hasText: 'Mode' })
    .locator('select')
    .first();

  const readNav = async () => page.locator('.sidebar').innerText();
  const readShell = async () =>
    page.evaluate(() => ({
      mode: document.querySelector('[data-customer-mode]')?.getAttribute('data-customer-mode'),
      full: document.querySelector('[data-full-access]')?.getAttribute('data-full-access'),
      hint: document.querySelector('.nav-mode-hint')?.textContent ?? '',
      sliding: /02 Sliding/i.test(document.querySelector('.sidebar')?.textContent ?? ''),
      quoteHint: /Mode quote path/i.test(document.querySelector('.sidebar')?.textContent ?? ''),
      vendorHint: /full software/i.test(document.querySelector('.sidebar')?.textContent ?? ''),
      homeTiles: document.querySelectorAll('.home-tile').length,
    }));

  // Start: home-owner quote path
  const start = await readShell();
  const homeOwnerOk =
    start.mode === 'home-owner' &&
    start.full === '0' &&
    start.quoteHint &&
    !start.sliding &&
    start.homeTiles <= 6;

  // Unlock Vendor via gate
  await modeSel.selectOption('vendor');
  await page.waitForTimeout(300);
  let gateShown = (await page.locator('.modal-card').count()) > 0;
  if (gateShown) {
    await page.locator('.modal-card input').nth(0).fill('Vendor Nav Test');
    await page.locator('.modal-card input').nth(1).fill('VEN/NAV');
    await page.locator('.modal-card input').nth(2).fill('36CCCCC0000C1Z5');
    await page.getByRole('button', { name: /Submit & unlock/i }).click();
    await page.waitForTimeout(400);
  }
  // No navigation / reload — same page URL
  const urlAfterVendor = page.url();
  const vendor = await readShell();
  const vendorOk =
    vendor.mode === 'vendor' &&
    vendor.full === '1' &&
    vendor.vendorHint &&
    vendor.sliding &&
    vendor.homeTiles >= 15 &&
    /127\.0\.0\.1:5173\/?$/.test(urlAfterVendor.replace(/\/$/, '/') || urlAfterVendor);

  await page.screenshot({ path: `${media}/toolkit-mode-vendor-nav.png`, fullPage: false });

  // Switch back to Home owner WITHOUT refresh — must collapse nav immediately
  await modeSel.selectOption('home-owner');
  await page.waitForTimeout(400);
  const back = await readShell();
  const backOk =
    back.mode === 'home-owner' &&
    back.full === '0' &&
    back.quoteHint &&
    !back.sliding &&
    back.homeTiles <= 6;

  await page.screenshot({ path: `${media}/toolkit-mode-homeowner-nav.png`, fullPage: false });

  // Architect (already may need gate) stays quote path
  await modeSel.selectOption('architects');
  await page.waitForTimeout(300);
  if ((await page.locator('.modal-card').count()) > 0) {
    await page.locator('.modal-card input').nth(0).fill('Arch Nav');
    await page.locator('.modal-card input').nth(1).fill('CA/NAV');
    await page.locator('.modal-card input').nth(2).fill('36AAAAA0000A1Z5');
    await page.getByRole('button', { name: /Submit & unlock/i }).click();
    await page.waitForTimeout(400);
  }
  const arch = await readShell();
  const archOk =
    arch.mode === 'architects' && arch.full === '0' && !arch.sliding && arch.quoteHint;

  // Deep-link Vendor-only route while quote-path → redirect home
  await page.goto('http://127.0.0.1:5173/sliding', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const redirected = /127\.0\.0\.1:5173\/?$/.test(page.url()) || page.url().endsWith('5173/');
  const stillQuote = !(await readNav()).match(/02 Sliding/i);

  // Re-select Vendor (already verified) — full tools again, no gate
  await modeSel.selectOption('vendor');
  await page.waitForTimeout(400);
  const gateAgain = (await page.locator('.modal-card').count()) > 0;
  const vendor2 = await readShell();
  const vendorReuseOk =
    !gateAgain && vendor2.mode === 'vendor' && vendor2.sliding && vendor2.full === '1';

  return {
    ok: homeOwnerOk && vendorOk && backOk && archOk && redirected && stillQuote && vendorReuseOk,
    homeOwnerOk,
    vendorOk,
    backOk,
    archOk,
    redirected,
    stillQuote,
    vendorReuseOk,
    gateShown,
    start,
    vendor,
    back,
    arch,
    vendor2,
  };
}
