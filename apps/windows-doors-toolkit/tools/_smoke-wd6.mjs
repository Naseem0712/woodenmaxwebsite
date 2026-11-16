export default async function (page) {
  const media =
    'C:/Users/nasim ahmad/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-8a059652-0882-4ad5-bc64-db92001caa6e/files/media';

  await page.goto('http://127.0.0.1:5173/settings/data', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  page.once('dialog', (d) => d.accept());
  const resetBtn = page.getByRole('button', { name: /Reset to seed/i });
  if (await resetBtn.count()) {
    await resetBtn.click();
    await page.waitForTimeout(600);
  }

  await page.goto('http://127.0.0.1:5173/settings/series', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1');
  await page.waitForTimeout(400);

  // Series toolbar select — first select inside .toolbar after page header
  const seriesSelect = page.locator('.toolbar select').first();
  await seriesSelect.waitFor({ state: 'visible' });
  const options = await seriesSelect.locator('option').allTextContents();
  const casementValue = await seriesSelect.locator('option').evaluateAll((opts) => {
    const hit = opts.find((o) => /casement/i.test(o.textContent || ''));
    return hit ? hit.value : null;
  });
  if (casementValue) {
    await seriesSelect.selectOption(casementValue);
  }
  await page.waitForTimeout(500);

  const body = await page.locator('main, .main, body').first().innerText();
  const hasRollers = /Rollers \/ shutter|Roller ₹/i.test(body);
  const hasFriction = /Friction stay/i.test(body);
  const hasTracks = /Default tracks/i.test(body);
  await page.screenshot({
    path: `${media}/toolkit-series-casement-hardware.png`,
    fullPage: true,
  });

  // Mismatch: Sliding name + casement kind
  const headerCard = page.locator('.card').filter({ hasText: 'Series header' }).first();
  const nameInput = headerCard.locator('input').first();
  await nameInput.fill('S35 Sliding PS');
  await page.waitForTimeout(400);
  const warnText = (await page.locator('.banner-warn').count())
    ? await page.locator('.banner-warn').innerText()
    : '';
  await page.screenshot({
    path: `${media}/toolkit-series-name-kind-warn.png`,
    fullPage: false,
  });

  // Also verify sliding series hides friction
  const slidingValue = await seriesSelect.locator('option').evaluateAll((opts) => {
    const hit = opts.find((o) => /sliding/i.test(o.textContent || '') && !/casement/i.test(o.textContent || ''));
    return hit ? hit.value : null;
  });
  if (slidingValue) {
    await seriesSelect.selectOption(slidingValue);
    await page.waitForTimeout(400);
  }
  const slidingBody = await page.locator('main, .main, body').first().innerText();
  const slidingHasFrictionCard = /Casement \/ openable hardware/i.test(slidingBody);
  const slidingHasRollers = /Rollers \/ shutter|Sliding hardware/i.test(slidingBody);

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.project-switcher');
  const modeSelect = page.locator('.project-switcher-label').filter({ hasText: /^Mode$/ }).locator('select');
  // label may wrap "Mode" as span
  const modeSel = page.locator('.project-switcher-label').filter({ hasText: 'Mode' }).locator('select').first();
  await modeSel.selectOption('architects');
  await page.waitForTimeout(250);
  await page.screenshot({
    path: `${media}/toolkit-project-mode.png`,
    fullPage: false,
  });

  await page.goto('http://127.0.0.1:5173/casement', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);
  const caseBody = await page.locator('body').innerText();

  return {
    options,
    casementValue,
    seriesPage: { hasRollers, hasFriction, hasTracks, warnText },
    slidingPage: { slidingHasFrictionCard, slidingHasRollers },
    casementTool: {
      caseHasRoller: /Rollers per|Roller rate/i.test(caseBody),
      caseHasStay: /Friction stay/i.test(caseBody),
    },
    ok:
      !!casementValue &&
      !hasRollers &&
      hasFriction &&
      !hasTracks &&
      /Sliding/i.test(warnText) &&
      slidingHasRollers &&
      !slidingHasFrictionCard &&
      !/Rollers per|Roller rate/i.test(caseBody) &&
      /Friction stay/i.test(caseBody),
  };
}
