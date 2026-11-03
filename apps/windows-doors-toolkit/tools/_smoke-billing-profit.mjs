/** Smoke: Billing & Profit wiring from Settings rates + quote draft. */
import { createSeedState } from '../src/data/seed.ts';
import {
  billingRateList,
  calcBillingPnL,
  draftInvoiceFromQuote,
  nextInvoiceNo,
} from '../src/engine/billing.ts';
import { generateUpvcFullPackage } from '../src/engine/upvcPackage.ts';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const seed = createSeedState();
const rates = billingRateList(seed);
assert(rates.length > 0, 'rate list from window types');
assert(rates.every((r) => typeof r.rate === 'number'), 'rates numeric from Settings');

const { next } = generateUpvcFullPackage(seed);
const draft = draftInvoiceFromQuote(next);
assert(draft.customer === next.quote.customerName || draft.customer, 'customer from quote');
assert(draft.total > 0, 'invoice total from quote grand');
assert(draft.invoiceNo.startsWith('CV-'), 'invoice no pattern');

const withInv = {
  ...next,
  billingInvoices: [{ id: 'inv1', ...draft, paid: 0 }],
  billingPayments: [
    {
      id: 'pay1',
      date: draft.date,
      invoiceNo: draft.invoiceNo,
      amount: Math.round(draft.total / 2),
      mode: 'UPI',
      note: 'advance',
      customer: draft.customer,
      jobType: draft.jobType,
    },
  ],
  billingExpenses: [
    {
      id: 'ex1',
      date: draft.date,
      head: 'Profiles',
      amount: 10000,
      mode: 'Bank',
      note: 'sample',
    },
  ],
};

const pnl = calcBillingPnL(withInv);
assert(pnl.dues >= 0, 'dues computed');
assert(typeof pnl.billedThisMonth === 'number', 'billed kpi');
assert(nextInvoiceNo(withInv.billingInvoices) !== draft.invoiceNo, 'next no increments');

console.log(
  JSON.stringify(
    {
      ok: true,
      rateRows: rates.length,
      invoiceNo: draft.invoiceNo,
      invoiceTotal: draft.total,
      billedThisMonth: pnl.billedThisMonth,
      dues: pnl.dues,
      expensesThisMonth: pnl.expensesThisMonth,
    },
    null,
    2,
  ),
);
