import type { BusinessInfo, BillingInvoice } from '../types';
import { normalizeGstSlab, normalizeGstSlabs, DEFAULT_GST_SLABS } from './gstTax';

export const DEFAULT_BILL_SERIES_PREFIX = 'INV-2026';

export function normalizeBillSeriesPrefix(raw: string | undefined | null): string {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || DEFAULT_BILL_SERIES_PREFIX;
}

export function normalizeBillNextSeq(raw: number | undefined | null): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 999_999);
}

export function ensureBusinessBillSeries(b: BusinessInfo): BusinessInfo {
  const gstSlabs = normalizeGstSlabs(b.gstSlabs);
  const defaultGstSlab = normalizeGstSlab(
    b.defaultGstSlab ?? b.gstPercent ?? 18,
    gstSlabs,
    18,
  );
  return {
    ...b,
    billSeriesPrefix: normalizeBillSeriesPrefix(b.billSeriesPrefix),
    billNextSeq: normalizeBillNextSeq(b.billNextSeq),
    gstSlabs,
    defaultGstSlab,
  };
}

export function formatBillNumber(prefix: string, seq: number): string {
  const p = normalizeBillSeriesPrefix(prefix);
  const n = normalizeBillNextSeq(seq);
  return `${p}-${String(n).padStart(3, '0')}`;
}

export function parseBillNumber(
  invoiceNo: string | undefined | null,
): { prefix: string; seq: number } | null {
  const raw = String(invoiceNo ?? '').trim();
  if (!raw) return null;
  const m = raw.match(/^(.*)-(\d+)$/);
  if (!m) return null;
  return {
    prefix: normalizeBillSeriesPrefix(m[1]),
    seq: normalizeBillNextSeq(Number(m[2])),
  };
}

export function peekNextBillNo(business: BusinessInfo): string {
  const b = ensureBusinessBillSeries(business);
  return formatBillNumber(b.billSeriesPrefix, b.billNextSeq);
}

export function billNumberTaken(
  invoices: BillingInvoice[],
  invoiceNo: string,
  exceptId?: string,
): boolean {
  const target = invoiceNo.trim().toLowerCase();
  if (!target) return false;
  return invoices.some(
    (inv) =>
      inv.id !== exceptId &&
      inv.status !== 'cancelled' &&
      inv.invoiceNo.trim().toLowerCase() === target,
  );
}

/**
 * Allocate next bill number from Settings series.
 * Refuses reuse of an existing non-cancelled invoice number (no dupes).
 * Sequence only increments — prefix stays fixed (no gaps on allocate).
 */
export function allocateBillNo(
  business: BusinessInfo,
  invoices: BillingInvoice[],
): { invoiceNo: string; business: BusinessInfo } {
  let b = ensureBusinessBillSeries(business);
  // Advance past any collisions so we never reuse
  for (let guard = 0; guard < 10_000; guard++) {
    const invoiceNo = formatBillNumber(b.billSeriesPrefix, b.billNextSeq);
    if (!billNumberTaken(invoices, invoiceNo)) {
      return {
        invoiceNo,
        business: { ...b, billNextSeq: b.billNextSeq + 1 },
      };
    }
    b = { ...b, billNextSeq: b.billNextSeq + 1 };
  }
  throw new Error('Could not allocate a unique bill number');
}

/** Manual edit: refuse reuse of another invoice's number. */
export function assertBillNoReusable(
  invoices: BillingInvoice[],
  invoiceNo: string,
  exceptId?: string,
): { ok: true } | { ok: false; reason: string } {
  const cleaned = invoiceNo.trim();
  if (!cleaned) return { ok: false, reason: 'Bill number is required' };
  if (billNumberTaken(invoices, cleaned, exceptId)) {
    return { ok: false, reason: `Bill number ${cleaned} is already used — reuse refused` };
  }
  return { ok: true };
}

export { DEFAULT_GST_SLABS };
