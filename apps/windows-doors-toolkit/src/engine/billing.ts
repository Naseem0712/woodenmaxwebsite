/**
 * Billing & Profit — mirrors Billing-Profit Kit structure.
 * Rate list reads Settings window types (never hardcode shop prices).
 * Invoice / payments / expenses / monthly P&L are shop-level registers.
 */
import type {
  AppState,
  BillingExpense,
  BillingInvoice,
  BillingPayment,
  WindowType,
} from '../types';
import { calcQuote, formatInr } from './calcs';

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

export function nextInvoiceNo(invoices: BillingInvoice[]): string {
  const nums = invoices
    .map((i) => {
      const m = /(\d+)$/.exec(i.invoiceNo);
      return m ? Number(m[1]) : 0;
    })
    .filter((n) => n > 0);
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `CV-${next}`;
}

export function dueDateFrom(invoiceDate: string, dueDays: number): string {
  if (!invoiceDate) return '';
  const d = new Date(invoiceDate);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Math.max(0, dueDays));
  return d.toISOString().slice(0, 10);
}

/** Draft invoice from active project quote (Settings GST + quote totals). */
export function draftInvoiceFromQuote(state: AppState): Omit<BillingInvoice, 'id'> {
  const q = calcQuote(state);
  const today = new Date().toISOString().slice(0, 10);
  const date = state.quote.quoteDate || today;
  const gst = q.gstApplied ? q.gst : 0;
  const amount = Math.round(q.afterDiscount);
  const total = Math.round(q.grand);
  const material = projectMaterialLabel(state);
  return {
    invoiceNo: nextInvoiceNo(state.billingInvoices),
    date,
    customer: state.quote.customerName || state.jobMeta.customerName || '',
    phone: state.quote.phone || '',
    jobType: `${material} windows`,
    amount,
    gst,
    total,
    paid: Math.round(q.advance) || 0,
    note: state.quote.notes || 'From Site Measure / Quotation package',
    dueDate: dueDateFrom(date, state.billingSettings.paymentDueDays),
    projectId: state.activeProjectId,
    quoteNo: state.quote.quoteNo,
  };
}

function projectMaterialLabel(state: AppState): string {
  const p = state.projects.find((x) => x.id === state.activeProjectId);
  return p?.material ?? 'UPVC';
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
