import type { AppState, CustomQuoteLine, CustomQuoteUnit, QuoteExtras } from '../types';

function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round((n + Number.EPSILON) * f) / f;
}

function formatNum(n: number, d = 2): string {
  return round(n, d).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
  });
}

function formatInr(n: number): string {
  return `₹${formatNum(n, 0)}`;
}

/** Resolve whether this quote applies GST. Quote toggle wins; else Settings default. */
export function resolveQuoteGst(state: AppState): {
  apply: boolean;
  percent: number;
  source: 'quote' | 'settings';
} {
  const percent = Number(state.business.gstPercent) || 0;
  if (typeof state.quote.applyGst === 'boolean') {
    return { apply: state.quote.applyGst, percent, source: 'quote' };
  }
  return { apply: Boolean(state.business.gstEnabled), percent, source: 'settings' };
}

/** Per-line % discount. Empty / 0 / null → no discount. */
export function applyLineDiscount(
  actualAmount: number,
  discountPercent?: number | null,
): {
  actual: number;
  discountPercent: number;
  discountAmount: number;
  selling: number;
  hasDiscount: boolean;
} {
  const actual = Math.max(0, Number(actualAmount) || 0);
  const raw = discountPercent == null ? 0 : Number(discountPercent);
  const pct = Number.isFinite(raw) && raw > 0 ? raw : 0;
  const discountAmount = round(actual * (pct / 100), 2);
  const selling = Math.max(0, round(actual - discountAmount, 2));
  return {
    actual,
    discountPercent: pct,
    discountAmount,
    selling,
    hasDiscount: pct > 0,
  };
}

/** Custom product amount from rate × qty × measure (pc uses measure=1). */
export function customLineActualAmount(
  line: Pick<CustomQuoteLine, 'rate' | 'qty' | 'unit' | 'measure'>,
): number {
  const rate = Math.max(0, Number(line.rate) || 0);
  const qty = Math.max(0, Number(line.qty) || 0);
  const measure = line.unit === 'pc' ? 1 : Math.max(0, Number(line.measure) || 0);
  return round(rate * qty * measure, 2);
}

export function calcCustomQuoteLines(state: AppState) {
  const rows = (state.customQuoteLines ?? []).map((line) => {
    const actual = customLineActualAmount(line);
    const disc = applyLineDiscount(actual, line.discountPercent);
    return { line, ...disc };
  });
  return {
    rows,
    totalActual: rows.reduce((s, r) => s + r.actual, 0),
    totalSelling: rows.reduce((s, r) => s + r.selling, 0),
    totalDiscount: rows.reduce((s, r) => s + r.discountAmount, 0),
  };
}

export function customUnitLabel(unit: CustomQuoteUnit): string {
  if (unit === 'pc') return 'per pc';
  if (unit === 'rft') return 'per rft';
  if (unit === 'sft') return 'per sft';
  return 'per kg';
}

/** GST on a taxable grand base (after all discounts). Off → 0. */
export function gstOnGrand(
  base: number,
  state: AppState,
): { gst: number; grand: number; apply: boolean; percent: number } {
  const { apply, percent } = resolveQuoteGst(state);
  const taxable = Math.max(0, base);
  const gst = apply && percent > 0 ? round(taxable * (percent / 100), 2) : 0;
  return { gst, grand: taxable + gst, apply, percent };
}

/** Footer blocks for PDF / print (description · terms · bank). */
export function buildQuoteFooterSections(
  quote: QuoteExtras,
  warrantyNote?: string,
): Array<{ title: string; body: string }> {
  const sections: Array<{ title: string; body: string }> = [];
  const description = (quote.description || quote.notes || '').trim();
  const terms = (quote.terms || '').trim();
  const bank = (quote.bankDetails || '').trim();
  const warranty = (warrantyNote || '').trim();
  if (description) sections.push({ title: 'Description', body: description });
  if (terms) sections.push({ title: 'Terms', body: terms });
  if (bank) sections.push({ title: 'Bank details', body: bank });
  if (warranty && !description.includes(warranty)) {
    sections.push({ title: 'Warranty', body: warranty });
  }
  return sections;
}

export function formatDiscountNarrative(disc: {
  hasDiscount: boolean;
  actual: number;
  discountPercent: number;
  discountAmount: number;
  selling: number;
}): string[] {
  if (!disc.hasDiscount) return [];
  return [
    `Actual amount: ${formatNum(disc.actual, 0)}`,
    `Discount: ${formatNum(disc.discountPercent, 2)}% (−${formatInr(disc.discountAmount)})`,
    `Selling amount: ${formatNum(disc.selling, 0)}`,
  ];
}
