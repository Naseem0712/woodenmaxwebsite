/** Smoke: Vendor labour ledger + Client accounts (persist math + real PDF/Excel). */
import { createSeedState } from '../src/data/seed.ts';
import {
  buildClientStatementExcelBytes,
  buildClientStatementPdfBytes,
  buildVendorLedgerExcelBytes,
  buildVendorLedgerPdfBytes,
} from '../src/engine/ledgerExport.ts';
import {
  addClientDiscount,
  addClientPayment,
  emptyLabourMember,
  emptyVendorTeam,
  labourEarned,
  labourPayable,
  normalizeHandle,
  postActiveQuoteToClient,
  postSavedQuoteToClient,
  summarizeClientAccount,
  summarizeVendorTeam,
} from '../src/engine/ledgers.ts';
import { snapshotActiveQuote, upsertSavedQuote } from '../src/engine/savedQuotes.ts';
import { generateUpvcFullPackage } from '../src/engine/upvcPackage.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function isPdf(buf) {
  return buf.length > 5 && Buffer.from(buf).slice(0, 5).toString('utf8') === '%PDF-';
}

function isZipXlsx(buf) {
  return buf.length > 3 && buf[0] === 0x50 && buf[1] === 0x4b;
}

const seed = createSeedState();
assert(Array.isArray(seed.vendorLabourTeams), 'seed vendor teams');
assert(Array.isArray(seed.clientAccounts), 'seed client accounts');

const { next } = generateUpvcFullPackage(seed);
const withCustomer = {
  ...next,
  quote: {
    ...next.quote,
    customerName: 'Ledger Test Client',
    phone: '9876543210',
    siteAddress: 'Hyderabad site',
    customerGstin: '29AAAAA0000A1Z5',
    advancePercent: 0,
    advanceAmount: 50000,
  },
};

// --- Vendor labour ---
const team = emptyVendorTeam({
  id: 'v1',
  vendorName: 'Ravi Fab Team',
  teamLeaderName: 'Ravi',
  handle: 'ravi-fab',
  phone: '9000000001',
});
assert(normalizeHandle(team.handle) === 'ravi-fab', 'vendor handle');
const lab1 = emptyLabourMember(team.id, {
  id: 'l1',
  name: 'Anil',
  role: 'Fitter',
  rate: 800,
  rateUnit: 'day',
  units: 5,
  advance: 1000,
  extraPayout: 500,
  budget: 6000,
  quoteAreaAmount: 2000,
  workSet: 'Villa install',
});
const lab2 = emptyLabourMember(team.id, {
  id: 'l2',
  name: 'Suresh',
  role: 'Helper',
  rate: 500,
  units: 5,
  advance: 500,
  quoteAreaAmount: 1000,
  workSet: 'Villa install',
});
assert(labourEarned(lab1) === 800 * 5 + 500, `earned ${labourEarned(lab1)}`);
const payouts = [
  {
    id: 'p1',
    vendorId: team.id,
    labourId: lab1.id,
    date: '2026-11-03',
    amount: 1500,
    kind: 'payout',
    note: 'week 1',
  },
];
assert(labourPayable(lab1, payouts) === 4500 + 2000 - 1000 - 1500, 'payable');
const vSum = summarizeVendorTeam(team, [lab1, lab2], payouts);
assert(vSum.memberCount === 2, '2 labour');
assert(vSum.advances === 1500, 'advances');

const vPdf = await buildVendorLedgerPdfBytes(withCustomer, team, [lab1, lab2], payouts);
const vXlsx = await buildVendorLedgerExcelBytes(withCustomer, team, [lab1, lab2], payouts);
assert(isPdf(vPdf), 'vendor pdf magic');
assert(isZipXlsx(vXlsx), 'vendor xlsx zip');

// --- Client account ---
const posted = postActiveQuoteToClient(withCustomer, []);
assert(posted.account.customerName === 'Ledger Test Client', 'client name');
assert(posted.account.handle.startsWith('ph-'), `handle ${posted.account.handle}`);
assert(posted.account.works.length === 1, 'one work');
assert(posted.account.works[0].advanceRecorded === 50000, 'advance recorded');
assert(posted.account.works[0].advanceRemaining === 50000, 'advance remaining');

let account = posted.account;
account = addClientPayment(account, {
  id: 'pay1',
  date: '2026-11-03',
  amount: 20000,
  type: 'upi',
  upiId: 'client@upi',
  note: 'part',
});
assert(account.works[0].advanceRemaining === 30000, 'advance reduced by payment');
account = addClientPayment(account, {
  id: 'pay2',
  date: '2026-11-04',
  amount: 10000,
  type: 'cash',
  cashName: 'Ramesh',
  note: '',
});
account = addClientPayment(account, {
  id: 'pay3',
  date: '2026-11-05',
  amount: 5000,
  type: 'bank',
  bankAccountName: 'Client A/C',
  bankAccountNo: '1234567890',
  note: '',
});
account = addClientDiscount(account, {
  id: 'd1',
  kind: 'percent',
  value: 5,
  note: 'final',
  appliedAt: '2026-11-03T00:00:00.000Z',
});
account = addClientDiscount(account, {
  id: 'd2',
  kind: 'gst_off',
  value: 0,
  note: '',
  appliedAt: '2026-11-03T00:00:00.000Z',
});
account = addClientDiscount(account, {
  id: 'd3',
  kind: 'fixed',
  value: 1000,
  note: 'less',
  appliedAt: '2026-11-03T00:00:00.000Z',
});

const cSum = summarizeClientAccount(account);
assert(cSum.paymentsTotal === 35000, `payments ${cSum.paymentsTotal}`);
assert(cSum.advanceRemaining === 15000, `adv left ${cSum.advanceRemaining}`);
assert(cSum.discountTotal > 1000, 'discounts applied');
assert(cSum.balance >= 0, 'balance non-neg');

const snap = snapshotActiveQuote(withCustomer);
const saved = upsertSavedQuote([], snap);
const fromSaved = postSavedQuoteToClient(saved[0], [account], 25000);
assert(fromSaved.account.works.some((w) => w.savedQuoteId === snap.id), 'saved quote linked');

const cPdf = await buildClientStatementPdfBytes(withCustomer, account);
const cXlsx = await buildClientStatementExcelBytes(withCustomer, account);
assert(isPdf(cPdf), 'client pdf');
assert(isZipXlsx(cXlsx), 'client xlsx');

console.log(
  JSON.stringify({
    ok: true,
    vendorPayable: vSum.payable,
    vendorPdf: vPdf.length,
    vendorXlsx: vXlsx.length,
    clientHandle: account.handle,
    clientBalance: cSum.balance,
    clientDiscount: cSum.discountTotal,
    clientPdf: cPdf.length,
    clientXlsx: cXlsx.length,
    works: account.works.length,
  }),
);
