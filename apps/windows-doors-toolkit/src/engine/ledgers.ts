import type {
  AppState,
  ClientAccount,
  ClientChargeLine,
  ClientDiscountKind,
  ClientDiscountLine,
  ClientPaymentLine,
  ClientWorkLine,
  SavedQuoteRecord,
  VendorLabourMember,
  VendorLabourPayout,
  VendorLabourTeam,
} from '../types';
import { calcQuote } from './calcs';

export function normalizeHandle(raw: string): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function clientHandleFromParts(parts: {
  phone?: string;
  email?: string;
  name?: string;
}): string {
  const phone = (parts.phone ?? '').replace(/\D/g, '');
  if (phone.length >= 8) return normalizeHandle(`ph-${phone}`);
  const email = (parts.email ?? '').trim().toLowerCase();
  if (email.includes('@')) return normalizeHandle(`em-${email}`);
  const name = (parts.name ?? '').trim();
  if (name) return normalizeHandle(`nm-${name}`);
  return normalizeHandle(`id-${Date.now()}`);
}

export function labourEarned(m: VendorLabourMember): number {
  return Math.max(0, (m.rate || 0) * (m.units || 0)) + Math.max(0, m.extraPayout || 0);
}

export function labourPayable(m: VendorLabourMember, payouts: VendorLabourPayout[]): number {
  const paid = payouts
    .filter((p) => p.labourId === m.id)
    .reduce((s, p) => s + Math.max(0, p.amount || 0), 0);
  const earned = labourEarned(m) + Math.max(0, m.quoteAreaAmount || 0);
  return Math.max(0, earned - Math.max(0, m.advance || 0) - paid);
}

export function labourBudgetLeft(m: VendorLabourMember): number {
  if (!(m.budget > 0)) return 0;
  return Math.max(0, m.budget - labourEarned(m) - Math.max(0, m.quoteAreaAmount || 0));
}

export function summarizeVendorTeam(
  team: VendorLabourTeam,
  members: VendorLabourMember[],
  payouts: VendorLabourPayout[],
) {
  const teamMembers = members.filter((m) => m.vendorId === team.id);
  const teamPayouts = payouts.filter((p) => p.vendorId === team.id);
  const advances = teamMembers.reduce((s, m) => s + Math.max(0, m.advance || 0), 0);
  const quoteArea = teamMembers.reduce((s, m) => s + Math.max(0, m.quoteAreaAmount || 0), 0);
  const earned = teamMembers.reduce((s, m) => s + labourEarned(m), 0);
  const paidOut = teamPayouts.reduce((s, p) => s + Math.max(0, p.amount || 0), 0);
  const budget = teamMembers.reduce((s, m) => s + Math.max(0, m.budget || 0), 0);
  const payable = teamMembers.reduce((s, m) => s + labourPayable(m, teamPayouts), 0);
  return {
    memberCount: teamMembers.length,
    advances,
    quoteArea,
    earned,
    paidOut,
    budget,
    payable,
    members: teamMembers,
    payouts: teamPayouts,
  };
}

export function discountAmountFor(
  kind: ClientDiscountKind,
  value: number,
  base: { worksTotal: number; chargesTotal: number; gstTotal: number },
): number {
  const taxableWorks = Math.max(0, base.worksTotal);
  const charges = Math.max(0, base.chargesTotal);
  const subtotal = taxableWorks + charges;
  if (kind === 'percent') return Math.round((subtotal * Math.max(0, value)) / 100);
  if (kind === 'fixed') return Math.max(0, value);
  if (kind === 'gst_off') return Math.max(0, base.gstTotal);
  return 0;
}

export function summarizeClientAccount(account: ClientAccount) {
  const worksTotal = account.works.reduce((s, w) => s + Math.max(0, w.quoteAmount || 0), 0);
  const taxableTotal = account.works.reduce((s, w) => s + Math.max(0, w.taxableAmount || 0), 0);
  const gstTotal = account.works.reduce((s, w) => s + Math.max(0, w.gstAmount || 0), 0);
  const chargesTotal = account.charges.reduce((s, c) => s + Math.max(0, c.amount || 0), 0);
  const paymentsTotal = account.payments.reduce((s, p) => s + Math.max(0, p.amount || 0), 0);
  const advanceRecorded = account.works.reduce((s, w) => s + Math.max(0, w.advanceRecorded || 0), 0);
  const advanceRemaining = account.works.reduce(
    (s, w) => s + Math.max(0, w.advanceRemaining || 0),
    0,
  );
  const discountTotal = account.discounts.reduce(
    (s, d) =>
      s +
      discountAmountFor(d.kind, d.value, {
        worksTotal,
        chargesTotal,
        gstTotal,
      }),
    0,
  );
  const gross = worksTotal + chargesTotal;
  const netDue = Math.max(0, gross - discountTotal);
  const balance = Math.max(0, netDue - paymentsTotal);
  return {
    worksTotal,
    taxableTotal,
    gstTotal,
    chargesTotal,
    paymentsTotal,
    advanceRecorded,
    advanceRemaining,
    discountTotal,
    gross,
    netDue,
    balance,
  };
}

/** Apply a payment against remaining advances (FIFO), then leave remainder as regular payment. */
export function applyPaymentToAdvances(
  works: ClientWorkLine[],
  paymentAmount: number,
): ClientWorkLine[] {
  let left = Math.max(0, paymentAmount);
  return works.map((w) => {
    if (left <= 0 || !(w.advanceRemaining > 0)) return w;
    const take = Math.min(w.advanceRemaining, left);
    left -= take;
    return { ...w, advanceRemaining: Math.max(0, w.advanceRemaining - take) };
  });
}

export function upsertClientAccount(
  list: ClientAccount[],
  next: ClientAccount,
): ClientAccount[] {
  const handle = normalizeHandle(next.handle);
  const idx = list.findIndex((a) => normalizeHandle(a.handle) === handle || a.id === next.id);
  const row = { ...next, handle, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    const copy = [...list];
    copy[idx] = { ...copy[idx], ...row, id: copy[idx].id };
    return copy;
  }
  return [...list, row];
}

export function findClientByHandle(
  list: ClientAccount[],
  handle: string,
): ClientAccount | undefined {
  const key = normalizeHandle(handle);
  return list.find((a) => normalizeHandle(a.handle) === key);
}

export function buildWorkFromSavedQuote(quote: SavedQuoteRecord): ClientWorkLine {
  const gstAmount = Math.max(0, (quote.grandTotal || 0) - (quote.taxableAmount || 0));
  return {
    id: `work-${quote.id}`,
    quoteNo: quote.quoteNo,
    savedQuoteId: quote.id,
    projectId: quote.projectId,
    projectName: quote.projectName,
    material: quote.material,
    quoteAmount: quote.grandTotal,
    taxableAmount: quote.taxableAmount,
    gstAmount,
    advanceRecorded: 0,
    advanceRemaining: 0,
    finalizedAt: quote.savedAt || new Date().toISOString(),
    note: '',
  };
}

export function buildWorkFromActiveQuote(state: AppState): {
  work: ClientWorkLine;
  customerName: string;
  phone: string;
  siteAddress: string;
  gstin: string;
} {
  const q = calcQuote(state);
  const project = state.projects.find((p) => p.id === state.activeProjectId);
  const gstAmount = Math.max(0, q.gst || 0);
  return {
    customerName: state.quote.customerName || project?.name || 'Customer',
    phone: state.quote.phone || '',
    siteAddress: state.quote.siteAddress || '',
    gstin: state.quote.customerGstin || '',
    work: {
      id: `work-active-${state.quote.quoteNo || state.activeProjectId}`,
      quoteNo: state.quote.quoteNo || 'DRAFT',
      projectId: state.activeProjectId,
      projectName: project?.name || '',
      material: project?.material || state.sliding.material,
      quoteAmount: q.grand,
      taxableAmount: q.afterDiscount,
      gstAmount,
      advanceRecorded: q.advance,
      advanceRemaining: q.advance,
      finalizedAt: new Date().toISOString(),
      note: 'From active quote',
    },
  };
}

export function postActiveQuoteToClient(
  state: AppState,
  accounts: ClientAccount[],
): { accounts: ClientAccount[]; account: ClientAccount } {
  const built = buildWorkFromActiveQuote(state);
  const handle = clientHandleFromParts({
    phone: built.phone,
    name: built.customerName,
  });
  const existing = findClientByHandle(accounts, handle);
  const base: ClientAccount = existing ?? {
    id: `client-${handle}`,
    handle,
    customerName: built.customerName,
    phone: built.phone,
    email: '',
    gstin: built.gstin,
    siteAddress: built.siteAddress,
    works: [],
    charges: [],
    payments: [],
    discounts: [],
    updatedAt: new Date().toISOString(),
  };
  const withoutDup = base.works.filter((w) => w.quoteNo !== built.work.quoteNo);
  const account: ClientAccount = {
    ...base,
    customerName: built.customerName || base.customerName,
    phone: built.phone || base.phone,
    gstin: built.gstin || base.gstin,
    siteAddress: built.siteAddress || base.siteAddress,
    works: [...withoutDup, built.work],
    updatedAt: new Date().toISOString(),
  };
  return { accounts: upsertClientAccount(accounts, account), account };
}

export function postSavedQuoteToClient(
  quote: SavedQuoteRecord,
  accounts: ClientAccount[],
  advance = 0,
): { accounts: ClientAccount[]; account: ClientAccount } {
  const handle = clientHandleFromParts({
    phone: quote.phone,
    name: quote.customerName,
  });
  const existing = findClientByHandle(accounts, handle);
  const work = {
    ...buildWorkFromSavedQuote(quote),
    advanceRecorded: Math.max(0, advance),
    advanceRemaining: Math.max(0, advance),
  };
  const base: ClientAccount = existing ?? {
    id: `client-${handle}`,
    handle,
    customerName: quote.customerName,
    phone: quote.phone,
    email: '',
    gstin: quote.customerGstin,
    siteAddress: quote.siteAddress,
    works: [],
    charges: [],
    payments: [],
    discounts: [],
    updatedAt: new Date().toISOString(),
  };
  const withoutDup = base.works.filter(
    (w) => w.quoteNo !== work.quoteNo && w.savedQuoteId !== quote.id,
  );
  const account: ClientAccount = {
    ...base,
    customerName: quote.customerName || base.customerName,
    phone: quote.phone || base.phone,
    gstin: quote.customerGstin || base.gstin,
    siteAddress: quote.siteAddress || base.siteAddress,
    works: [...withoutDup, work],
    updatedAt: new Date().toISOString(),
  };
  return { accounts: upsertClientAccount(accounts, account), account };
}

export function addClientPayment(
  account: ClientAccount,
  payment: ClientPaymentLine,
): ClientAccount {
  return {
    ...account,
    works: applyPaymentToAdvances(account.works, payment.amount),
    payments: [...account.payments, payment],
    updatedAt: new Date().toISOString(),
  };
}

export function addClientCharge(
  account: ClientAccount,
  charge: ClientChargeLine,
): ClientAccount {
  return {
    ...account,
    charges: [...account.charges, charge],
    updatedAt: new Date().toISOString(),
  };
}

export function addClientDiscount(
  account: ClientAccount,
  discount: ClientDiscountLine,
): ClientAccount {
  return {
    ...account,
    discounts: [...account.discounts, discount],
    updatedAt: new Date().toISOString(),
  };
}

export function emptyVendorTeam(partial?: Partial<VendorLabourTeam>): VendorLabourTeam {
  const now = new Date().toISOString().slice(0, 10);
  const vendorName = partial?.vendorName?.trim() || 'Vendor team';
  const handle = normalizeHandle(partial?.handle || vendorName);
  return {
    id: partial?.id || `vendor-${Date.now()}`,
    handle,
    vendorName,
    teamLeaderName: partial?.teamLeaderName || '',
    phone: partial?.phone || '',
    note: partial?.note || '',
    createdAt: partial?.createdAt || now,
  };
}

export function emptyLabourMember(
  vendorId: string,
  partial?: Partial<VendorLabourMember>,
): VendorLabourMember {
  return {
    id: partial?.id || `lab-${Date.now()}`,
    vendorId,
    name: partial?.name || '',
    role: partial?.role || 'Fitter',
    rate: partial?.rate ?? 0,
    rateUnit: partial?.rateUnit || 'day',
    workSet: partial?.workSet || '',
    advance: partial?.advance ?? 0,
    extraPayout: partial?.extraPayout ?? 0,
    budget: partial?.budget ?? 0,
    quoteAreaAmount: partial?.quoteAreaAmount ?? 0,
    units: partial?.units ?? 1,
    note: partial?.note || '',
  };
}
