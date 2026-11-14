/**
 * Billing & Profit — mirrors Billing-Profit Kit structure.
 * Rate list reads Settings window types (never hardcode shop prices).
 * Invoice / payments / expenses / monthly P&L are shop-level registers.
 * Tax Invoice path: saved quotes → bill series → CGST+SGST / IGST.
 */
import { v4 as uid } from 'uuid';
import type {
  AppState,
  BillingExpense,
  BillingInvoice,
  BillingInvoiceLine,
  BillingPayment,
  SavedQuoteRecord,
  WindowType,
} from '../types';
import { calcQuote, formatInr } from './calcs';
import {
  allocateBillNo,
  ensureBusinessBillSeries,
  peekNextBillNo,
} from './billSeries';
import {
  normalizeGstSlab,
  placeOfSupplyCode,
  resolveTaxSplit,
  splitLineTax,
} from './gstTax';
import { recomputeInvoiceTaxes } from './taxInvoice';

export interface BillingRateRow {
  id: string;
  name: string;
  material: string;
  kind: string;
  unit: string;
  rate: number;
}

export function billingRateList(state: AppState): BillingRateRow[] {
  return state.windowTypes
    .slice()
    .sort((a, b) => {
      if (a.material !== b.material) return a.material.localeCompare(b.material);
      return a.name.localeCompare(b.name);
    })
    .map((wt: WindowType) => ({
      id: wt.id,
      name: wt.name,
      material: wt.material,
      kind: wt.kind,
      unit: 'per sqft',
      rate: wt.ratePerSqft,
    }));
}

export function invoiceBalance(inv: BillingInvoice): number {
  return Math.max(0, inv.total - inv.paid);
}

export function paidOnInvoice(payments: BillingPayment[], invoiceNo: string): number {
  return payments
    .filter((p) => p.invoiceNo === invoiceNo)
    .reduce((s, p) => s + p.amount, 0);
}

/** Recompute paid / balance from payment register. */
export function syncInvoicePaid(
  invoices: BillingInvoice[],
  payments: BillingPayment[],
): BillingInvoice[] {
  return invoices.map((inv) => {
    const paid = paidOnInvoice(payments, inv.invoiceNo);
    return { ...inv, paid, /* balance derived */ };
  });
}

function monthKey(isoDate: string): string {
  if (!isoDate || isoDate.length < 7) return '';
  return isoDate.slice(0, 7);
}

function isStaffHead(head: string): boolean {
  return /pay|salary|wage|staff|fabricator|fitter|helper/i.test(head);
}

function isMaterialHead(head: string): boolean {
  return /profile|glass|hardware|steel|gasket|seal|mesh|reinforcement/i.test(head);
}

export interface BillingMonthRow {
  month: string;
  billed: number;
  gst: number;
  collected: number;
  material: number;
  staffPay: number;
  otherExpenses: number;
  allExpenses: number;
  netProfit: number;
  marginPct: number;
}

export function calcBillingPnL(state: AppState): {
  months: BillingMonthRow[];
  billedThisMonth: number;
  collectedThisMonth: number;
  dues: number;
  expensesThisMonth: number;
  netThisMonth: number;
  turnover12m: number;
} {
  const invoices = syncInvoicePaid(state.billingInvoices, state.billingPayments);
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthSet = new Set<string>();
  for (const inv of invoices) monthSet.add(monthKey(inv.date));
  for (const p of state.billingPayments) monthSet.add(monthKey(p.date));
  for (const e of state.billingExpenses) monthSet.add(monthKey(e.date));
  // Always include trailing 12 calendar months
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const months = [...monthSet]
    .filter(Boolean)
    .sort()
    .map((month) => {
      const billed = invoices
        .filter((i) => monthKey(i.date) === month)
        .reduce((s, i) => s + i.amount, 0);
      const gst = invoices
        .filter((i) => monthKey(i.date) === month)
        .reduce((s, i) => s + i.gst, 0);
      const collected = state.billingPayments
        .filter((p) => monthKey(p.date) === month)
        .reduce((s, p) => s + p.amount, 0);
      const expenses = state.billingExpenses.filter((e) => monthKey(e.date) === month);
      const material = expenses.filter((e) => isMaterialHead(e.head)).reduce((s, e) => s + e.amount, 0);
      const staffPay = expenses.filter((e) => isStaffHead(e.head)).reduce((s, e) => s + e.amount, 0);
      const allExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const otherExpenses = Math.max(0, allExpenses - material - staffPay);
      const netProfit = billed - allExpenses;
      const marginPct = billed <= 0 ? 0 : netProfit / billed;
      return {
        month,
        billed,
        gst,
        collected,
        material,
        staffPay,
        otherExpenses,
        allExpenses,
        netProfit,
        marginPct,
      };
    });

  const thisRow = months.find((m) => m.month === thisMonth);
  const dues = invoices.reduce((s, i) => s + invoiceBalance(i), 0);
  const turnover12m = months.slice(-12).reduce((s, m) => s + m.billed, 0);

  return {
    months,
    billedThisMonth: thisRow?.billed ?? 0,
    collectedThisMonth: thisRow?.collected ?? 0,
    dues,
    expensesThisMonth: thisRow?.allExpenses ?? 0,
    netThisMonth: thisRow?.netProfit ?? 0,
    turnover12m,
  };
}

export function dueDateFrom(invoiceDate: string, dueDays: number): string {
  if (!invoiceDate) return '';
  const d = new Date(invoiceDate);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Math.max(0, dueDays));
  return d.toISOString().slice(0, 10);
}

/** @deprecated Prefer peekNextBillNo / allocateBillNo from billSeries. */
export function nextInvoiceNo(invoices: BillingInvoice[], business?: AppState['business']): string {
  if (business) return peekNextBillNo(business);
  const nums = invoices
    .map((i) => {
      const m = /(\d+)$/.exec(i.invoiceNo);
      return m ? Number(m[1]) : 0;
    })
    .filter((n) => n > 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `INV-2026-${String(next).padStart(3, '0')}`;
}

function projectMaterialLabel(state: AppState): string {
  const p = state.projects.find((x) => x.id === state.activeProjectId);
  return p?.material ?? 'UPVC';
}

function linesFromSavedQuote(
  quote: SavedQuoteRecord,
  business: AppState['business'],
  mode: ReturnType<typeof resolveTaxSplit>,
): BillingInvoiceLine[] {
  const b = ensureBusinessBillSeries(business);
  return quote.lines.map((line) => {
    const gstPercent = normalizeGstSlab(line.gstPercent, b.gstSlabs, b.defaultGstSlab);
    const split = splitLineTax({ taxable: line.amount, gstPercent }, mode);
    return {
      id: uid(),
      description: line.description,
      hsn: line.hsn || '7610',
      qty: line.qty,
      unit: line.unit,
      rate: line.rate,
      amount: line.amount,
      gstPercent,
      cgst: split.cgst,
      sgst: split.sgst,
      igst: split.igst,
      total: split.total,
    };
  });
}

/**
 * Create a Tax Invoice from a saved quote.
 * Enforces one-quote-one-bill unless the prior bill is cancelled / cleared.
 */
export function createBillFromSavedQuote(
  state: AppState,
  quote: SavedQuoteRecord,
): {
  ok: true;
  invoice: BillingInvoice;
  business: AppState['business'];
} | { ok: false; reason: string } {
  if (quote.billedInvoiceId) {
    const existing = state.billingInvoices.find((i) => i.id === quote.billedInvoiceId);
    if (existing && existing.status !== 'cancelled') {
      return {
        ok: false,
        reason: `Quote ${quote.quoteNo} is already billed as ${existing.invoiceNo}. Clear billed status first.`,
      };
    }
  }

  const business = ensureBusinessBillSeries(state.business);
  const allocated = allocateBillNo(business, state.billingInvoices);
  const today = new Date().toISOString().slice(0, 10);
  const date = today;
  const customerGstin = quote.customerGstin || '';
  const taxMode = resolveTaxSplit(business.gstin, customerGstin);
  const lines = linesFromSavedQuote(quote, allocated.business, taxMode);
  const draft: BillingInvoice = {
    id: uid(),
    invoiceNo: allocated.invoiceNo,
    date,
    customer: quote.customerName,
    phone: quote.phone,
    jobType: `${quote.material} windows`,
    amount: 0,
    gst: 0,
    total: 0,
    paid: 0,
    note: `From quote ${quote.quoteNo}`,
    dueDate: dueDateFrom(date, state.billingSettings.paymentDueDays),
    projectId: quote.projectId,
    quoteNo: quote.quoteNo,
    customerGstin,
    billingAddress: quote.billingAddress || quote.siteAddress,
    shippingAddress: quote.shippingAddress || quote.siteAddress,
    placeOfSupply: placeOfSupplyCode(business.gstin, customerGstin),
    eWayBillNo: '',
    vehicleNo: '',
    transportName: '',
    taxMode,
    lines,
    status: 'issued',
    savedQuoteId: quote.id,
  };
  const invoice = recomputeInvoiceTaxes(draft, allocated.business.gstin);
  return { ok: true, invoice, business: allocated.business };
}

/** Draft invoice from active project quote (Settings GST + quote totals). */
export function draftInvoiceFromQuote(state: AppState): {
  draft: Omit<BillingInvoice, 'id'>;
  business: AppState['business'];
} {
  const q = calcQuote(state);
  const business = ensureBusinessBillSeries(state.business);
  const allocated = allocateBillNo(business, state.billingInvoices);
  const today = new Date().toISOString().slice(0, 10);
  const date = state.quote.quoteDate || today;
  const customerGstin = state.quote.customerGstin || '';
  const taxMode = resolveTaxSplit(allocated.business.gstin, customerGstin);
  const material = projectMaterialLabel(state);
  const gstPercent = normalizeGstSlab(
    allocated.business.defaultGstSlab,
    allocated.business.gstSlabs,
    18,
  );
  const taxable = Math.round(q.afterDiscount);
  const split = splitLineTax({ taxable, gstPercent }, taxMode);
  const line: BillingInvoiceLine = {
    id: uid(),
    description: state.quote.description || `${material} windows package`,
    hsn: '7610',
    qty: 1,
    unit: 'lot',
    rate: taxable,
    amount: taxable,
    gstPercent,
    cgst: split.cgst,
    sgst: split.sgst,
    igst: split.igst,
    total: split.total,
  };
  const draft: Omit<BillingInvoice, 'id'> = {
    invoiceNo: allocated.invoiceNo,
    date,
    customer: state.quote.customerName || state.jobMeta.customerName || '',
    phone: state.quote.phone || '',
    jobType: `${material} windows`,
    amount: taxable,
    gst: split.tax,
    total: split.total,
    paid: Math.round(q.advance) || 0,
    note: state.quote.notes || 'From active quote',
    dueDate: dueDateFrom(date, state.billingSettings.paymentDueDays),
    projectId: state.activeProjectId,
    quoteNo: state.quote.quoteNo,
    customerGstin,
    billingAddress: state.quote.billingAddress || state.quote.siteAddress || '',
    shippingAddress: state.quote.shippingAddress || state.quote.siteAddress || '',
    placeOfSupply: placeOfSupplyCode(allocated.business.gstin, customerGstin),
    eWayBillNo: '',
    vehicleNo: '',
    transportName: '',
    taxMode,
    lines: [line],
    status: 'issued',
    cgst: split.cgst,
    sgst: split.sgst,
    igst: split.igst,
    taxableAmount: taxable,
  };
  return { draft, business: allocated.business };
}

export function formatBillingMoney(n: number): string {
  return formatInr(n);
}

export function expenseByHead(expenses: BillingExpense[]): Array<{ head: string; amount: number }> {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.head, (map.get(e.head) ?? 0) + e.amount);
  }
  return [...map.entries()]
    .map(([head, amount]) => ({ head, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export { peekNextBillNo, allocateBillNo, ensureBusinessBillSeries };
