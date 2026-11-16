/** Smoke: Billing Tax Invoice + Profit wiring (Settings rates, quote→bill, GST split, series). */
import { createSeedState } from '../src/data/seed.ts';
import {
  billingRateList,
  calcBillingPnL,
  createBillFromSavedQuote,
  draftInvoiceFromQuote,
  nextInvoiceNo,
} from '../src/engine/billing.ts';
import { assertBillNoReusable, peekNextBillNo } from '../src/engine/billSeries.ts';
import { resolveTaxSplit, gstinStateCode } from '../src/engine/gstTax.ts';
import { snapshotActiveQuote, upsertSavedQuote } from '../src/engine/savedQuotes.ts';
import {
  buildTaxInvoiceExcelBytes,
  buildTaxInvoicePdfBytes,
} from '../src/engine/taxInvoice.ts';
import { generateUpvcFullPackage } from '../src/engine/upvcPackage.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function isPdf(buf) {
  return buf.length > 5 && Buffer.from(buf).slice(0, 5).toString('utf8') === '%PDF-';
}

function isZipXlsx(buf) {
  // XLSX is a ZIP — PK magic
  return buf.length > 3 && buf[0] === 0x50 && buf[1] === 0x4b;
}

const seed = createSeedState();
const rates = billingRateList(seed);
assert(rates.length > 0, 'rate list from window types');
assert(rates.every((r) => typeof r.rate === 'number'), 'rates numeric from Settings');
assert(seed.business.billSeriesPrefix === 'INV-2026', 'bill series seed');
assert(peekNextBillNo(seed.business) === 'INV-2026-001', 'peek bill');

// GST split rules
assert(gstinStateCode('29AAAAA0000A1Z5') === '29', 'seller KA');
assert(resolveTaxSplit('29AAAAA0000A1Z5', '29BBBBB0000B1Z5') === 'cgst_sgst', 'same state');
assert(resolveTaxSplit('29AAAAA0000A1Z5', '27CCCCC0000C1Z5') === 'igst', 'diff state');
assert(resolveTaxSplit('29AAAAA0000A1Z5', '') === 'igst', 'missing customer → IGST');

const { next } = generateUpvcFullPackage(seed);
const withGstin = {
  ...next,
  quote: {
    ...next.quote,
    customerGstin: '29XXXXX0000X1Z5', // same state as seller 29
    billingAddress: 'Billing lane',
    shippingAddress: 'Ship lane',
  },
};

const snap = snapshotActiveQuote(withGstin);
assert(snap.lines.length > 0, 'saved quote lines');
let saved = upsertSavedQuote([], snap);

const bill1 = createBillFromSavedQuote({ ...withGstin, savedQuotes: saved }, snap);
assert(bill1.ok, bill1.ok ? '' : bill1.reason);
assert(bill1.invoice.invoiceNo === 'INV-2026-001', `bill no ${bill1.invoice.invoiceNo}`);
assert(bill1.invoice.taxMode === 'cgst_sgst', 'same-state CGST+SGST');
assert((bill1.invoice.cgst || 0) > 0 && (bill1.invoice.sgst || 0) > 0, 'cgst sgst amounts');
assert((bill1.invoice.igst || 0) === 0, 'no igst same state');

saved = upsertSavedQuote(saved, { ...snap, billedInvoiceId: bill1.invoice.id });
const dup = createBillFromSavedQuote(
  {
    ...withGstin,
    business: bill1.business,
    billingInvoices: [bill1.invoice],
    savedQuotes: saved,
  },
  { ...snap, billedInvoiceId: bill1.invoice.id },
);
assert(!dup.ok, 'one-quote-one-bill refused');

const reuse = assertBillNoReusable([bill1.invoice], 'INV-2026-001');
assert(!reuse.ok, 'refuse reuse');

// Inter-state
const interSnap = {
  ...snap,
  id: 'q2',
  quoteNo: 'Q-2026-099',
  customerGstin: '27YYYYY0000Y1Z5',
  billedInvoiceId: null,
};
const bill2 = createBillFromSavedQuote(
  {
    ...withGstin,
    business: bill1.business,
    billingInvoices: [bill1.invoice],
    savedQuotes: [interSnap],
  },
  interSnap,
);
assert(bill2.ok, bill2.ok ? '' : bill2.reason);
assert(bill2.invoice.taxMode === 'igst', 'inter-state IGST');
assert((bill2.invoice.igst || 0) > 0, 'igst amount');
assert(bill2.invoice.invoiceNo === 'INV-2026-002', 'series increments no gap');

const { draft, business: afterDraft } = draftInvoiceFromQuote(withGstin);
assert(draft.invoiceNo.startsWith('INV-'), `draft series ${draft.invoiceNo}`);
assert(afterDraft.billNextSeq > withGstin.business.billNextSeq, 'seq bumped');

const withInv = {
  ...withGstin,
  business: bill2.business,
  billingInvoices: [bill1.invoice, bill2.invoice],
  billingPayments: [
    {
      id: 'pay1',
      date: bill1.invoice.date,
      invoiceNo: bill1.invoice.invoiceNo,
      amount: Math.round(bill1.invoice.total / 2),
      mode: 'UPI',
      note: 'advance',
      customer: bill1.invoice.customer,
      jobType: bill1.invoice.jobType,
    },
  ],
  billingExpenses: [
    {
      id: 'ex1',
      date: bill1.invoice.date,
      head: 'Profiles',
      amount: 10000,
      mode: 'Bank',
      note: 'sample',
    },
  ],
  savedQuotes: saved,
};

const pnl = calcBillingPnL(withInv);
assert(pnl.dues >= 0, 'dues computed');
assert(typeof pnl.billedThisMonth === 'number', 'billed kpi');
assert(
  nextInvoiceNo(withInv.billingInvoices, withInv.business) !== bill1.invoice.invoiceNo,
  'next no increments',
);

const pdfBytes = await buildTaxInvoicePdfBytes(withInv, bill1.invoice);
assert(isPdf(pdfBytes), 'tax invoice PDF magic');
const xlsxBytes = await buildTaxInvoiceExcelBytes(withInv, bill1.invoice);
assert(isZipXlsx(xlsxBytes), 'tax invoice xlsx ZIP magic');

console.log(
  JSON.stringify(
    {
      ok: true,
      rateRows: rates.length,
      invoiceNo: bill1.invoice.invoiceNo,
      taxMode: bill1.invoice.taxMode,
      invoiceTotal: bill1.invoice.total,
      interInvoiceNo: bill2.invoice.invoiceNo,
      interTaxMode: bill2.invoice.taxMode,
      pdfBytes: pdfBytes.length,
      xlsxBytes: xlsxBytes.length,
      billedThisMonth: pnl.billedThisMonth,
      dues: pnl.dues,
    },
    null,
    2,
  ),
);
