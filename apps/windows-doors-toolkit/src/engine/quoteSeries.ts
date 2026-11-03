import type { BusinessInfo } from '../types';

/** Default quote series — Settings-editable; only the running number increments. */
export const DEFAULT_QUOTE_SERIES_PREFIX = 'Q-2026';

export function normalizeQuoteSeriesPrefix(raw: string | undefined | null): string {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || DEFAULT_QUOTE_SERIES_PREFIX;
}

export function normalizeQuoteNextSeq(raw: number | undefined | null): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 999_999);
}

export function ensureBusinessQuoteSeries(b: BusinessInfo): BusinessInfo {
  return {
    ...b,
    quoteSeriesPrefix: normalizeQuoteSeriesPrefix(b.quoteSeriesPrefix),
    quoteNextSeq: normalizeQuoteNextSeq(b.quoteNextSeq),
  };
}

/** Format e.g. Q-2026-001 */
export function formatQuoteNumber(prefix: string, seq: number): string {
  const p = normalizeQuoteSeriesPrefix(prefix);
  const n = normalizeQuoteNextSeq(seq);
  return `${p}-${String(n).padStart(3, '0')}`;
}

/**
 * Parse `Q-2026-001` → { prefix: 'Q-2026', seq: 1 }.
 * Accepts trailing numeric segment after the last hyphen.
 */
export function parseQuoteNumber(
  quoteNo: string | undefined | null,
): { prefix: string; seq: number } | null {
  const raw = String(quoteNo ?? '').trim();
  if (!raw) return null;
  const m = raw.match(/^(.*)-(\d+)$/);
  if (!m) return null;
  const prefix = normalizeQuoteSeriesPrefix(m[1]);
  const seq = normalizeQuoteNextSeq(Number(m[2]));
  return { prefix, seq };
}

/** Next quote number from Settings series — does not mutate. */
export function peekNextQuoteNo(business: BusinessInfo): string {
  const b = ensureBusinessQuoteSeries(business);
  return formatQuoteNumber(b.quoteSeriesPrefix, b.quoteNextSeq);
}

/**
 * Allocate the next quote number from the fixed Settings series.
 * Increments quoteNextSeq so the series prefix stays stable across quotes.
 */
export function allocateQuoteNo(business: BusinessInfo): {
  quoteNo: string;
  business: BusinessInfo;
} {
  const b = ensureBusinessQuoteSeries(business);
  const quoteNo = formatQuoteNumber(b.quoteSeriesPrefix, b.quoteNextSeq);
  return {
    quoteNo,
    business: {
      ...b,
      quoteNextSeq: b.quoteNextSeq + 1,
    },
  };
}

/**
 * Ensure quote.quoteNo is set from Settings series without inventing a new prefix.
 * Allocates + bumps sequence only when quoteNo is currently empty.
 */
export function ensureQuoteNumbered(
  business: BusinessInfo,
  quoteNo: string | undefined | null,
): { quoteNo: string; business: BusinessInfo; allocated: boolean } {
  const existing = String(quoteNo ?? '').trim();
  if (existing) {
    return {
      quoteNo: existing,
      business: ensureBusinessQuoteSeries(business),
      allocated: false,
    };
  }
  const allocated = allocateQuoteNo(business);
  return { ...allocated, allocated: true };
}
