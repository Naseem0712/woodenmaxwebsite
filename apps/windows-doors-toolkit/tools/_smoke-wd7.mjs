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

  // Home owner configurator
  await page.goto('http://127.0.0.1:5173/configure', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
  await page.waitForTimeout(400);
  const body1 = await page.locator('main').innerText();
  const hasSteps = /Select type|Material|Add to quote|Glass|Colour/i.test(body1);
  const hasTabs = /List|Areas|Materials|Hardwares/i.test(body1);
  await page.screenshot({ path: `${media}/toolkit-homeowner-configurator.png`, fullPage: true });

  // Verification gate — Architects
  const modeSel = page
    .locator('.project-switcher-label')
    .filter({ hasText: 'Mode' })
    .locator('select')
    .first();
  await modeSel.selectOption('architects');
  await page.waitForTimeout(300);
  const gateVisible = (await page.locator('.modal-card').count()) > 0;
  const gateText = gateVisible ? await page.locator('.modal-card').innerText() : '';
  await page.screenshot({ path: `${media}/toolkit-mode-verification-gate.png`, fullPage: false });

  if (gateVisible) {
    await page.locator('.modal-card input').nth(0).fill('Studio Verify Architect');
    await page.locator('.modal-card input').nth(1).fill('CA/WD/2026');
    await page.locator('.modal-card input').nth(2).fill('36AAAAA0000A1Z5');
    await page.getByRole('button', { name: /Submit & unlock/i }).click();
    await page.waitForTimeout(400);
  }

  await page.goto('http://127.0.0.1:5173/configure', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const archBody = await page.locator('main').innerText();
  const architectDiscount =
    /10%|Architect|below retail|discount/i.test(archBody) &&
    /Mode discount/i.test(archBody);
  await page.screenshot({ path: `${media}/toolkit-architect-price.png`, fullPage: true });

  // Builder mode — verify + lower threshold so seed quote crosses it
  await modeSel.selectOption('builder');
  await page.waitForTimeout(300);
  if ((await page.locator('.modal-card').count()) > 0) {
    await page.locator('.modal-card input').nth(0).fill('Builder Co');
    await page.locator('.modal-card input').nth(1).fill('BLD/99');
    await page.locator('.modal-card input').nth(2).fill('36BBBBB0000B1Z5');
    await page.getByRole('button', { name: /Submit & unlock/i }).click();
    await page.waitForTimeout(400);
  }

  await page.goto('http://127.0.0.1:5173/settings/allowances', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  // Lower builder threshold so sample cart triggers 15% off
  const thresholdField = page.locator('.card').filter({ hasText: 'Mode pricing' }).locator('input').nth(2);
  await thresholdField.fill('1000');
  await thresholdField.blur();
  await page.waitForTimeout(200);

  await page.goto('http://127.0.0.1:5173/configure', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const builderBody = await page.locator('main').innerText();
  const builderOff = /15%|Builder|threshold|Mode discount/i.test(builderBody);
  await page.screenshot({ path: `${media}/toolkit-builder-threshold.png`, fullPage: true });

  // Colours settings
  await page.goto('http://127.0.0.1:5173/settings/colours', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);
  const coloursOk = /Colour|White|Wood laminate/i.test(await page.locator('main').innerText());

  // Vendor unlock keeps fab tools visible
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(200);
  await modeSel.selectOption('vendor');
  await page.waitForTimeout(300);
  if ((await page.locator('.modal-card').count()) > 0) {
    await page.locator('.modal-card input').nth(0).fill('Vendor Fab');
    await page.locator('.modal-card input').nth(1).fill('VEN/1');
    await page.locator('.modal-card input').nth(2).fill('36CCCCC0000C1Z5');
    await page.getByRole('button', { name: /Submit & unlock/i }).click();
    await page.waitForTimeout(300);
  }
  const navText = await page.locator('.sidebar').innerText();
  const vendorFullAccess = /02 Sliding|05 Cutting|Configurator|Settings/i.test(navText);

  return {
    ok: hasSteps && hasTabs && gateVisible && architectDiscount && builderOff && coloursOk && vendorFullAccess,
    hasSteps,
    hasTabs,
    gateVisible,
    gateHasGst: /GST/i.test(gateText),
    architectDiscount,
    builderOff,
    coloursOk,
    vendorFullAccess,
  };
}
