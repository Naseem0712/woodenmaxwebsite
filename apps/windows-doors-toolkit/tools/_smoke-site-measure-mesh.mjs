/** Smoke: landing = site-measure; set sliding 3-track with mesh; screenshot. */
export default async function (page, ui) {
  const results = { landing: null, path: null, livingMesh: null, errors: [] };
  page.on('pageerror', (e) => results.errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') results.errors.push(msg.text());
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  results.path = page.url();
  results.landing = results.path.includes('site-measure');

  // Clear localStorage and reload seed for predictable UI
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('wd-toolkit')) localStorage.removeItem(k);
    }
  });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  results.pathAfterReset = page.url();
  results.landingAfterReset = results.pathAfterReset.includes('site-measure');

  const title = await page.locator('h1, .page-header h1, .page-title').first().textContent().catch(() => '');
  results.heading = (title || '').trim();

  // Living room seed is 3-track with rolling mesh — verify columns render
  const headers = await page.locator('table.data thead th').allTextContents();
  results.hasGlassDoorsCol = headers.some((h) => /glass doors/i.test(h));
  results.hasMeshDoorsCol = headers.some((h) => /mesh doors/i.test(h));
  results.hasMeshTypeCol = headers.some((h) => /mesh type/i.test(h));
  results.hasTracksCol = headers.some((h) => /tracks/i.test(h));

  // Find Living room row and bump tracks to 3 / mesh if needed
  const rows = page.locator('table.data tbody tr');
  const count = await rows.count();
  results.rowCount = count;
  let livingIdx = -1;
  for (let i = 0; i < count; i++) {
    const loc = await rows.nth(i).locator('td input').nth(2).inputValue().catch(() => '');
    if (/living/i.test(loc)) {
      livingIdx = i;
      break;
    }
  }
  results.livingIdx = livingIdx;

  if (livingIdx >= 0) {
    const row = rows.nth(livingIdx);
    // Tracks NumberInput — find by header index
    const trackCell = row.locator('td').nth(12); // Date,Lead,Loc,Type,W,H,LessW,LessH,NetW,NetH,Unit,Qty,Tracks
    const trackInput = trackCell.locator('input').first();
    if (await trackInput.count()) {
      await trackInput.click({ clickCount: 3 });
      await trackInput.fill('3');
      await trackInput.blur();
      await page.waitForTimeout(300);
    }
    const meshDoorsCell = row.locator('td').nth(14);
    const meshDoorsInput = meshDoorsCell.locator('input').first();
    if (await meshDoorsInput.count()) {
      await meshDoorsInput.click({ clickCount: 3 });
      await meshDoorsInput.fill('1');
      await meshDoorsInput.blur();
    }
    const meshTypeSelect = row.locator('td').nth(15).locator('select').first();
    if (await meshTypeSelect.count()) {
      await meshTypeSelect.selectOption('rolling');
    }
    results.livingMesh = {
      tracks: await trackInput.inputValue().catch(() => null),
      meshDoors: await meshDoorsInput.inputValue().catch(() => null),
      meshType: await meshTypeSelect.inputValue().catch(() => null),
    };
  }

  await page.screenshot({
    path: 'D:/Downloads/Windows-Doors-Toolkit/tools/_smoke-site-measure-landing.png',
    fullPage: true,
  });

  // Push to 02/03 and open sliding
  const pushCosting = page.getByRole('button', { name: /Push → 02\/03 Costing/i });
  if (await pushCosting.count()) {
    await pushCosting.click();
    await page.waitForTimeout(400);
  }
  await page.goto('http://127.0.0.1:5173/sliding', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  results.slidingUrl = page.url();
  const bodyText = await page.locator('main').innerText();
  results.slidingHasMeshDoors = /Mesh doors/i.test(bodyText);
  results.slidingHasMeshType = /Mesh type/i.test(bodyText);
  await page.screenshot({
    path: 'D:/Downloads/Windows-Doors-Toolkit/tools/_smoke-sliding-mesh.png',
    fullPage: true,
  });

  results.ok =
    results.landingAfterReset &&
    results.hasGlassDoorsCol &&
    results.hasMeshDoorsCol &&
    results.hasMeshTypeCol &&
    results.errors.length === 0;

  return results;
}
