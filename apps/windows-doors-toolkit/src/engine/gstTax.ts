/** GSTIN first-2 digits = state code. Same → CGST+SGST; else / missing → IGST. */

export type TaxSplitMode = 'cgst_sgst' | 'igst';

export const DEFAULT_GST_SLABS = [5, 12, 18] as const;

export function gstinStateCode(gstin: string | undefined | null): string | null {
  const raw = String(gstin ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
  if (raw.length < 2) return null;
  const code = raw.slice(0, 2);
  return /^\d{2}$/.test(code) ? code : null;
}

export function resolveTaxSplit(
  sellerGstin: string | undefined | null,
  customerGstin: string | undefined | null,
): TaxSplitMode {
  const seller = gstinStateCode(sellerGstin);
  const customer = gstinStateCode(customerGstin);
  if (seller && customer && seller === customer) return 'cgst_sgst';
  return 'igst';
}

export function normalizeGstSlab(
  raw: number | undefined | null,
  allowed: number[] = [...DEFAULT_GST_SLABS],
  fallback = 18,
): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  const exact = allowed.find((s) => s === n);
  if (exact != null) return exact;
  // Allow custom but clamp to sensible range
  return Math.min(28, Math.max(0, Math.round(n * 100) / 100));
}

export function normalizeGstSlabs(raw: number[] | undefined | null): number[] {
  const list = (raw ?? [...DEFAULT_GST_SLABS])
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n >= 0)
    .map((n) => Math.round(n * 100) / 100);
  const uniq = [...new Set(list)].sort((a, b) => a - b);
  return uniq.length ? uniq : [...DEFAULT_GST_SLABS];
}

export interface LineTaxInput {
  taxable: number;
  gstPercent: number;
}

export interface LineTaxResult {
  taxable: number;
  gstPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  total: number;
}

function money(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function splitLineTax(
  input: LineTaxInput,
  mode: TaxSplitMode,
): LineTaxResult {
  const taxable = money(Math.max(0, input.taxable));
  const gstPercent = Math.max(0, input.gstPercent);
  const tax = money((taxable * gstPercent) / 100);
  if (mode === 'cgst_sgst') {
    const half = money(tax / 2);
    // Keep CGST+SGST = tax (adjust SGST for odd paise)
    const cgst = half;
    const sgst = money(tax - cgst);
    return { taxable, gstPercent, cgst, sgst, igst: 0, tax, total: money(taxable + tax) };
  }
  return {
    taxable,
    gstPercent,
    cgst: 0,
    sgst: 0,
    igst: tax,
    tax,
    total: money(taxable + tax),
  };
}

export function sumLineTaxes(lines: LineTaxResult[]): {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  total: number;
} {
  return lines.reduce(
    (acc, l) => ({
      taxable: money(acc.taxable + l.taxable),
      cgst: money(acc.cgst + l.cgst),
      sgst: money(acc.sgst + l.sgst),
      igst: money(acc.igst + l.igst),
      tax: money(acc.tax + l.tax),
      total: money(acc.total + l.total),
    }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0, total: 0 },
  );
}

/** Place of supply = customer state code when present, else seller. */
export function placeOfSupplyCode(
  sellerGstin: string | undefined | null,
  customerGstin: string | undefined | null,
): string {
  return gstinStateCode(customerGstin) || gstinStateCode(sellerGstin) || '—';
}
