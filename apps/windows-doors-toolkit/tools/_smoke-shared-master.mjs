/** Smoke: shop-owner shared master edit + Vendor private override (shared base unchanged). */
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

  const modeSel = () =>
    page.locator('.project-switcher-label').filter({ hasText: 'Mode' }).locator('select').first();

  const readShell = async () =>
    page.evaluate(() => ({
      mode: document.querySelector('[data-customer-mode]')?.getAttribute('data-customer-mode'),
      full: document.querySelector('[data-full-access]')?.getAttribute('data-full-access'),
      sliding: /02 Sliding/i.test(document.querySelector('.sidebar')?.textContent ?? ''),
      hasMaster: /Master catalogue/i.test(document.querySelector('.sidebar')?.textContent ?? ''),
      hasWindowTypes: /Window types/i.test(document.querySelector('.sidebar')?.textContent ?? ''),
      hasProfiles: /Profiles catalogue/i.test(document.querySelector('.sidebar')?.textContent ?? ''),
      hasStock: /Series stock/i.test(document.querySelector('.sidebar')?.textContent ?? ''),
    }));

  // A) Home owner quote path still reaches shared-master Settings (shop-owner testing)
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.sidebar');
  await page.waitForTimeout(300);
  const home = await readShell();
  const homeOwnerNavOk =
    home.mode === 'home-owner' &&
    home.full === '0' &&
    !home.sliding &&
    home.hasMaster &&
    home.hasWindowTypes &&
    home.hasProfiles &&
    !home.hasStock;

  await page.goto('http://127.0.0.1:5173/settings/master', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
  await page.waitForTimeout(300);
  const masterBody = await page.locator('main').innerText();
  const shopOwnerBanner = /Shop-owner testing path|Shared master/i.test(masterBody);
  const noOverrideCols = !(await page.locator('th', { hasText: /My override/i }).count());

  // Edit first shared window-type rate
  const firstShared = page.locator('table.data tbody tr').first().locator('input').first();
  await firstShared.waitFor({ state: 'visible' });
  const beforeShared = Number((await firstShared.inputValue()).replace(/,/g, '')) || 0;
  const sharedEdit = beforeShared + 111;
  await firstShared.fill(String(sharedEdit));
  await firstShared.blur();
  await page.waitForTimeout(200);
  const afterShared = Number((await firstShared.inputValue()).replace(/,/g, '')) || 0;
  const sharedEditOk = afterShared === sharedEdit;

  // Dedicated CRUD page reachable without Vendor
  await page.goto('http://127.0.0.1:5173/settings/window-types', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const onWindowTypes =
    /window types/i.test(await page.locator('h1').innerText()) &&
    !/127\.0\.0\.1:5173\/?$/.test(page.url());

  await page.screenshot({ path: `${media}/toolkit-shop-owner-shared-master.png`, fullPage: false });

  // B) Vendor unlock → private override does not rewrite shared
  await modeSel().selectOption('vendor');
  await page.waitForTimeout(300);
  if ((await page.locator('.modal-card').count()) > 0) {
    await page.locator('.modal-card input').nth(0).fill('Vendor Master Test');
    await page.locator('.modal-card input').nth(1).fill('VEN/MASTER');
    await page.locator('.modal-card input').nth(2).fill('36VVVVV0000V1Z5');
    await page.getByRole('button', { name: /Submit & unlock/i }).click();
    await page.waitForTimeout(400);
  }

  await page.goto('http://127.0.0.1:5173/settings/master', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const vendorShell = await readShell();
  const vendorNavOk =
    vendorShell.mode === 'vendor' &&
    vendorShell.full === '1' &&
    vendorShell.sliding &&
    vendorShell.hasStock;

  const overrideHeader = (await page.locator('th', { hasText: /My override/i }).count()) > 0;
  const sharedInput = page.locator('table.data tbody tr').first().locator('input').first();
  const sharedWhileVendor = Number((await sharedInput.inputValue()).replace(/,/g, '')) || 0;
  const sharedIntact = sharedWhileVendor === sharedEdit;

  const overrideInput = page.locator('table.data tbody tr').first().locator('input').nth(1);
  await overrideInput.fill(String(sharedEdit + 50));
  await overrideInput.blur();
  await page.waitForTimeout(250);
  const sharedAfterOverride = Number((await sharedInput.inputValue()).replace(/,/g, '')) || 0;
  const overrideDoesNotRewriteShared = sharedAfterOverride === sharedEdit;

  // Effective column should show override
  const effectiveText = await page.locator('table.data tbody tr').first().locator('td.calc').innerText();
  const effectiveShowsOverride = effectiveText.includes(String(sharedEdit + 50));

  await page.screenshot({ path: `${media}/toolkit-vendor-private-override.png`, fullPage: false });

  // C) Back to Home owner — override columns gone; shared edit remains; fab tools gone
  await modeSel().selectOption('home-owner');
  await page.waitForTimeout(400);
  const back = await readShell();
  const backOk =
    back.mode === 'home-owner' &&
    back.full === '0' &&
    !back.sliding &&
    back.hasMaster &&
    !back.hasStock;
  const overrideGone = (await page.locator('th', { hasText: /My override/i }).count()) === 0;
  const sharedStill = Number((await page.locator('table.data tbody tr').first().locator('input').first().inputValue()).replace(/,/g, '')) || 0;
  const sharedPersisted = sharedStill === sharedEdit;

  // Stock stays Vendor-only
  await page.goto('http://127.0.0.1:5173/stock', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const stockBlocked = /127\.0\.0\.1:5173\/?$/.test(page.url()) || page.url().endsWith('5173/');

  return {
    ok:
      homeOwnerNavOk &&
      shopOwnerBanner &&
      noOverrideCols &&
      sharedEditOk &&
      onWindowTypes &&
      vendorNavOk &&
      overrideHeader &&
      sharedIntact &&
      overrideDoesNotRewriteShared &&
      effectiveShowsOverride &&
      backOk &&
      overrideGone &&
      sharedPersisted &&
      stockBlocked,
    homeOwnerNavOk,
    shopOwnerBanner,
    noOverrideCols,
    sharedEditOk,
    beforeShared,
    sharedEdit,
    onWindowTypes,
    vendorNavOk,
    overrideHeader,
    sharedIntact,
    overrideDoesNotRewriteShared,
    effectiveShowsOverride,
    backOk,
    overrideGone,
    sharedPersisted,
    stockBlocked,
  };
}
