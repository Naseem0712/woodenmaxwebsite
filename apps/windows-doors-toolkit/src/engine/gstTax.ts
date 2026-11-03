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

/** GSTIN state codes → names (Busy / tax-invoice Place of Supply). */
export const GST_STATE_NAMES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

export function gstStateName(code: string | undefined | null): string {
  const c = String(code ?? '').trim();
  if (!c) return '';
  return GST_STATE_NAMES[c] || '';
}

/** Format as "Telangana (36)" when name known; else code or —. */
export function formatPlaceOfSupplyLabel(code: string | undefined | null): string {
  const c = String(code ?? '').trim();
  if (!c || c === '—') return '—';
  const name = gstStateName(c);
  return name ? `${name} (${c})` : c;
}

/** Place of supply = customer state code when present, else seller. */
export function placeOfSupplyCode(
  sellerGstin: string | undefined | null,
  customerGstin: string | undefined | null,
): string {
  return gstinStateCode(customerGstin) || gstinStateCode(sellerGstin) || '—';
}

export function placeOfSupplyLabel(
  sellerGstin: string | undefined | null,
  customerGstin: string | undefined | null,
): string {
  return formatPlaceOfSupplyLabel(placeOfSupplyCode(sellerGstin, customerGstin));
}
