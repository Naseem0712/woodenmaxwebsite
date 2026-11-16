import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const mediaDir =
  'C:/Users/nasim ahmad/AppData/Local/Cursor/AgentStores/cursor_agent_stores/bc-8a059652-0882-4ad5-bc64-db92001caa6e/files/media';
fs.mkdirSync(mediaDir, { recursive: true });

const EMAIL = 'info@acme-windows.com';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

async function clearToolkitStorage() {
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('wd-toolkit')) localStorage.removeItem(k);
    }
  });
}

await page.goto('http://127.0.0.1:5173/site-measure', { waitUntil: 'networkidle' });
await clearToolkitStorage();
await page.goto('http://127.0.0.1:5173/site-measure', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// Switch Mode → Vendor (opens verification gate)
const modeSelect = page.locator('.project-switcher select').filter({ hasText: 'Home owner' }).first();
// Mode select is the one with Home owner / Architect options
const modeSelects = page.locator('.project-switcher select');
const count = await modeSelects.count();
let modeIdx = -1;
for (let i = 0; i < count; i++) {
  const text = await modeSelects.nth(i).innerText();
  if (/Home owner/i.test(text) && /Vendor/i.test(text)) {
    modeIdx = i;
    break;
  }
}
if (modeIdx < 0) throw new Error('Mode select not found');
await modeSelects.nth(modeIdx).selectOption('vendor');
await page.waitForTimeout(400);

const dialog = page.getByRole('dialog');
await dialog.waitFor({ state: 'visible' });
const title = await dialog.locator('h2').innerText();
if (!/Verify Vendor mode/i.test(title)) throw new Error(`Unexpected gate title: ${title}`);

const body = await dialog.innerText();
if (/Professional main ID/i.test(body)) throw new Error('Old Professional main ID label still present');
if (!/Professional \/ business email/i.test(body)) throw new Error('Business email label missing');

await dialog.getByPlaceholder('Firm / person name').fill('Acme Fabricators');
await dialog.getByPlaceholder('info@company.com').fill(EMAIL);
await dialog.getByPlaceholder('10-digit mobile').fill('9876543210');
await dialog.getByPlaceholder('Locality / area').fill('Banjara Hills');
await dialog.getByPlaceholder('City').fill('Hyderabad');
await dialog.getByPlaceholder('22AAAAA0000A1Z5').fill('36AAAAA0000A1Z5');

await page.screenshot({
  path: path.join(mediaDir, 'toolkit-verify-vendor-email-gate.png'),
  fullPage: false,
});
await page.screenshot({
  path: 'D:/Downloads/Windows-Doors-Toolkit/tools/_smoke-verify-gate.png',
});

await dialog.getByRole('button', { name: /Submit & unlock Vendor/i }).click();
await page.waitForTimeout(700);

// Confirm mode switched + account stored
const afterSubmit = await page.evaluate((email) => {
  const stateKey = Object.keys(localStorage).find((k) => /^wd-toolkit-v\d+$/.test(k));
  const state = stateKey ? JSON.parse(localStorage.getItem(stateKey) || '{}') : null;
  const accounts = JSON.parse(localStorage.getItem('wd-toolkit-accounts-v1') || '{}');
  const account = accounts.byEmail?.[email.toLowerCase()];
  const active = (state?.projects || []).find((p) => p.id === state?.activeProjectId);
  return {
    mode: active?.customerMode,
    verification: (state?.modeVerifications || []).find((v) => v.modeId === 'vendor'),
    accountCustomerId: account?.customerId || null,
    accountEmail: account?.email || null,
    projectCount: state?.projects?.length ?? 0,
  };
}, EMAIL);

if (afterSubmit.mode !== 'vendor') throw new Error(`Mode not vendor: ${afterSubmit.mode}`);
if (!afterSubmit.verification?.email || afterSubmit.verification.email !== EMAIL.toLowerCase()) {
  throw new Error(`Verification email missing: ${JSON.stringify(afterSubmit.verification)}`);
}
if (!afterSubmit.accountCustomerId?.startsWith('cust_')) {
  throw new Error(`Customer ID missing: ${afterSubmit.accountCustomerId}`);
}
if (afterSubmit.verification.customerId !== afterSubmit.accountCustomerId) {
  throw new Error('Verification customerId mismatch vs account DB');
}

// Rename project so restore has a distinctive marker
await page.getByRole('button', { name: 'Rename' }).click();
await page.waitForTimeout(200);
const renameInput = page.locator('.project-switcher input').first();
await renameInput.fill('Acme Restored Job');
await renameInput.blur();
await page.waitForTimeout(500);

// Wipe main toolkit state but keep accounts DB — simulate return visit
await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    if (/^wd-toolkit-v\d+$/.test(k)) localStorage.removeItem(k);
  }
});
await page.goto('http://127.0.0.1:5173/site-measure', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

// Mode → Vendor again; fill email; restore
const modeSelects2 = page.locator('.project-switcher select');
const count2 = await modeSelects2.count();
let modeIdx2 = -1;
for (let i = 0; i < count2; i++) {
  const text = await modeSelects2.nth(i).innerText();
  if (/Home owner/i.test(text) && /Vendor/i.test(text)) {
    modeIdx2 = i;
    break;
  }
}
await modeSelects2.nth(modeIdx2).selectOption('vendor');
await page.waitForTimeout(400);
const dialog2 = page.getByRole('dialog');
await dialog2.waitFor({ state: 'visible' });
await dialog2.getByPlaceholder('info@company.com').fill(EMAIL);
await page.waitForTimeout(300);
await dialog2.getByRole('button', { name: /Fill profile from saved data/i }).click();
await page.waitForTimeout(200);
const restoreCheck = dialog2.locator('input[type="checkbox"]');
if (!(await restoreCheck.isChecked())) await restoreCheck.check();
await dialog2.getByRole('button', { name: /Submit & unlock Vendor/i }).click();
await page.waitForTimeout(900);

const restored = await page.evaluate(() => {
  const stateKey = Object.keys(localStorage).find((k) => /^wd-toolkit-v\d+$/.test(k));
  const state = stateKey ? JSON.parse(localStorage.getItem(stateKey) || '{}') : null;
  const names = (state?.projects || []).map((p) => p.name);
  const active = (state?.projects || []).find((p) => p.id === state?.activeProjectId);
  return {
    names,
    mode: active?.customerMode,
    email: (state?.modeVerifications || []).find((v) => v.modeId === 'vendor')?.email,
  };
});

if (!restored.names.includes('Acme Restored Job')) {
  throw new Error(`Restore failed — projects: ${JSON.stringify(restored.names)}`);
}
if (restored.mode !== 'vendor') throw new Error(`Restored mode not vendor: ${restored.mode}`);

await page.screenshot({
  path: path.join(mediaDir, 'toolkit-verify-email-restored.png'),
  fullPage: false,
});

console.log(
  JSON.stringify(
    {
      ok: true,
      customerId: afterSubmit.accountCustomerId,
      email: EMAIL,
      restoredProject: 'Acme Restored Job',
      gateTitle: title,
    },
    null,
    2,
  ),
);

await browser.close();
